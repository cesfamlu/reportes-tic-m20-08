
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getDatabase, ref, onValue, update, remove } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";


const firebaseConfig = {
    apiKey: "AIzaSyBPxvqvNfHKE1YJe4h6UwHznY4jsZMiJ0A", 
    authDomain: "reportes-cesfam.firebaseapp.com",
    databaseURL: "https://reportes-cesfam-default-rtdb.firebaseio.com",
    projectId: "reportes-cesfam",
    storageBucket: "reportes-cesfam.appspot.com", 
    messagingSenderId: "101243881563",
    appId: "1:101243881563:web:793a5a48ffce80f2a4977e"
};


const passwordScreen = document.getElementById('password-screen');
const passwordForm = document.getElementById('password-form');
const passwordInput = document.getElementById('password-input');
const passwordError = document.getElementById('password-error');
const appContent = document.getElementById('app-content');
const loginCurrentYearSpan = document.getElementById('loginCurrentYear');

if(loginCurrentYearSpan) {
    loginCurrentYearSpan.textContent = new Date().getFullYear();
}


let database;
let todosLosReportes = []; 
let reportesFiltradosMostrados = []; 
let cantidadPorPagina = 10;
let paginaActual = 1;

let tablaReportes, tablaReportesHead, buscadorInput, filtroEstadoSelect, btnCargarMas, appCurrentYearSpan;


let viewTextModal, viewTextModalTitle, viewTextModalContent, viewTextModalCloseButton;


let confirmationModal, modalTitle, modalMessage, modalConfirmButton, modalCancelButton;
let confirmCallback = null;



function initializeAppAndListeners() {
   
    const app = initializeApp(firebaseConfig);
    database = getDatabase(app); // Assign to global 'database'

    
    tablaReportes = document.getElementById('tabla-reportes');
    tablaReportesHead = document.getElementById('tabla-reportes-head'); 
    buscadorInput = document.getElementById('buscador');
    filtroEstadoSelect = document.getElementById('filtroEstado');
    btnCargarMas = document.getElementById('btn-cargar-mas');
    appCurrentYearSpan = document.getElementById('appCurrentYear');

    viewTextModal = document.getElementById('viewTextModal');
    viewTextModalTitle = document.getElementById('viewTextModalTitle');
    viewTextModalContent = document.getElementById('viewTextModalContent');
    viewTextModalCloseButton = document.getElementById('viewTextModalCloseButton');
    
    confirmationModal = document.getElementById('confirmationModal');
    modalTitle = document.getElementById('modalTitle');
    modalMessage = document.getElementById('modalMessage');
    modalConfirmButton = document.getElementById('modalConfirmButton');
    modalCancelButton = document.getElementById('modalCancelButton');


    if (appCurrentYearSpan) {
        appCurrentYearSpan.textContent = new Date().getFullYear();
    }


    modalConfirmButton.addEventListener('click', () => {
        if (confirmCallback) {
            confirmCallback();
        }
        confirmationModal.classList.remove('active');
    });

    modalCancelButton.addEventListener('click', () => {
        confirmationModal.classList.remove('active');
    });
    
    viewTextModalCloseButton.addEventListener('click', () => {
        viewTextModal.classList.remove('active');
    });
    viewTextModal.addEventListener('click', (event) => {
        if (event.target === viewTextModal) {
            viewTextModal.classList.remove('active');
        }
    });
    tablaReportes.addEventListener('click', function(event) {
        const targetCell = event.target.closest('.view-full-text');
        if (targetCell) {
            const fullText = targetCell.dataset.fulltext;
            const label = targetCell.closest('td').dataset.label;
            showViewTextModal(`Detalle de ${label}`, fullText);
        }
    });


  
    const reportesRef = ref(database, 'reportes/');
    onValue(reportesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            todosLosReportes = Object.entries(data)
                .map(([key, val]) => ({ key, ...val }))
                .sort((a, b) => {
                    if (b.fecha && a.fecha) return b.fecha.localeCompare(a.fecha);
                    if (b.fecha) return 1; 
                    if (a.fecha) return -1; 
                    return 0;
                });
        } else {
            todosLosReportes = [];
        }
        paginaActual = 1; 
        renderizarReportes();
    }, (error) => {
        console.error("Error fetching initial data:", error);
        showToast("Error al cargar los datos iniciales.", "error");
    });

    
    buscadorInput.addEventListener('input', () => {
        paginaActual = 1; 
        renderizarReportes();
    });
    filtroEstadoSelect.addEventListener('change', () => {
        paginaActual = 1; 
        renderizarReportes();
    });
    btnCargarMas.addEventListener('click', () => {
        paginaActual++;
        renderizarReportes(true); 
    });
}


// --- Password Form Logic ---
passwordForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const enteredPassword = passwordInput.value;
    if (enteredPassword === "tic2026") {
        passwordScreen.classList.add('hidden');
        appContent.classList.remove('hidden');
        initializeAppAndListeners(); 
    } else {
        passwordError.textContent = "Contraseña incorrecta. Inténtalo de nuevo.";
        passwordInput.classList.add('border-red-500', 'focus:ring-red-500');
        setTimeout(() => {
            passwordError.textContent = "";
            passwordInput.classList.remove('border-red-500', 'focus:ring-red-500');
            passwordInput.value = ""; 
        }, 3000);
    }
});


const normalizeStateString = (str) => {
    if (str === null || typeof str === 'undefined' || String(str).trim() === "") { 
        return null; 
    }
    return String(str).replace(/\s+/g, ' ').trim().toLowerCase();
};



function showToast(message, type = 'success', duration = 3000) {
    const toastPlaceholder = document.getElementById('toastPlaceholder');
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.textContent = message;
    toastPlaceholder.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 10); 

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300); 
    }, duration);
}

function showConfirmationModal(title, message, onConfirm) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    confirmCallback = onConfirm;
    confirmationModal.classList.add('active');
}


function showViewTextModal(title, text) {
    viewTextModalTitle.textContent = title;
    viewTextModalContent.textContent = text; 
    viewTextModal.classList.add('active');
}

function renderizarReportes(append = false) {
    if (!append) {
        reportesFiltradosMostrados = []; 
        if(tablaReportes) tablaReportes.innerHTML = ""; 
    }

    const textoBusqueda = buscadorInput.value.toLowerCase().trim(); 
    const estadoSeleccionado = filtroEstadoSelect.value; 

    const reportesFiltrados = todosLosReportes.filter(r => {
        const nombreMatch = r.nombre ? r.nombre.toLowerCase().includes(textoBusqueda) : false;
        const areaMatch = r.area ? r.area.toLowerCase().includes(textoBusqueda) : false;
        
        const estadoReporteParaSearch = normalizeStateString(r.estado); 
        const estadoEnTextoMatch = estadoReporteParaSearch ? estadoReporteParaSearch.includes(textoBusqueda) : false;
        
        const matchTexto = nombreMatch || areaMatch || estadoEnTextoMatch;
        
        let estadoReporteNormalizado = normalizeStateString(r.estado); 
        const estadoFiltroNormalizado = normalizeStateString(estadoSeleccionado); 

        if (estadoFiltroNormalizado === "pendiente" && estadoReporteNormalizado === null) {
            estadoReporteNormalizado = "pendiente";
        }
        
        const matchEstado = !estadoFiltroNormalizado || (estadoReporteNormalizado === estadoFiltroNormalizado);
        
        return matchTexto && matchEstado;
    });

    const inicio = (paginaActual - 1) * cantidadPorPagina;
    const fin = paginaActual * cantidadPorPagina;
    
    const reportesParaEstaPagina = reportesFiltrados.slice(inicio, fin);

    if (!append) {
         reportesFiltradosMostrados = reportesParaEstaPagina;
         if(tablaReportes) tablaReportes.innerHTML = ''; 
    } else {
        reportesFiltradosMostrados = reportesFiltradosMostrados.concat(reportesParaEstaPagina.filter(p => !reportesFiltradosMostrados.find(e => e.key === p.key)));
    }
    
    const targetNode = tablaReportes;
    if (!append && targetNode) targetNode.innerHTML = ''; 

    if (!targetNode) return; 

    reportesParaEstaPagina.forEach(reporte => { 
        if (append && targetNode.querySelector(`tr[data-reporte-key="${reporte.key}"]`)) {
            return;
        }

        const solucionTexto = reporte.solucion ? reporte.solucion : 'Sin solución registrada'; 
        const solucionDisplay = reporte.solucion ? reporte.solucion.replace(/</g, "&lt;").replace(/>/g, "&gt;") : '<i class="text-custom-text-secondary">Sin solución registrada</i>';
        
        const problemaTexto = reporte.problema ? reporte.problema : 'No especificado'; 
        const problemaDisplay = reporte.problema ? reporte.problema.replace(/</g, "&lt;").replace(/>/g, "&gt;") : '<i class="text-custom-text-secondary">No especificado</i>';

        const contactoTexto = reporte.contacto ? reporte.contacto.replace(/</g, "&lt;").replace(/>/g, "&gt;") : '<span class="text-custom-text-secondary">N/A</span>';
        
        const fila = document.createElement('tr');
        fila.setAttribute('data-reporte-key', reporte.key); 
        fila.className = "bg-custom-bg-content even:bg-custom-bg-content-alt/50 border-b border-custom-border-separator block md:table-row mb-4 md:mb-0 rounded-elements md:rounded-none overflow-hidden shadow-md md:shadow-none hover:bg-custom-bg-content-alt transition-colors duration-150";
        
        let estadoActualNormalizado = normalizeStateString(reporte.estado);
        const reporteIdCorto = reporte.key && typeof reporte.key === 'string' ? reporte.key.substring(0, 8) : 'N/A';


        fila.innerHTML = `
            <td data-label="ID Reporte" class="px-4 py-3 text-xs text-custom-text-secondary whitespace-nowrap block md:table-cell text-left relative before:content-[attr(data-label)] before:font-bold before:block md:before:hidden before:text-custom-accent-primary before:mb-1">${reporteIdCorto}</td>
            <td data-label="Nombre" class="px-6 py-3 font-medium whitespace-nowrap block md:table-cell text-left relative before:content-[attr(data-label)] before:font-bold before:block md:before:hidden before:text-custom-accent-primary before:mb-1">${reporte.nombre.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>
            <td data-label="Contacto" class="px-6 py-3 block md:table-cell text-left relative before:content-[attr(data-label)] before:font-bold before:block md:before:hidden before:text-custom-accent-primary before:mb-1">${contactoTexto}</td>
            <td data-label="Área" class="px-6 py-3 block md:table-cell text-left relative before:content-[attr(data-label)] before:font-bold before:block md:before:hidden before:text-custom-accent-primary before:mb-1">${reporte.area.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>
            <td data-label="Fecha" class="px-6 py-3 block md:table-cell text-left relative before:content-[attr(data-label)] before:font-bold before:block md:before:hidden before:text-custom-accent-primary before:mb-1">${reporte.fecha}</td>
            <td data-label="Problema" class="px-6 py-3 block md:table-cell text-left relative before:content-[attr(data-label)] before:font-bold before:block md:before:hidden before:text-custom-accent-primary before:mb-1">
                <div class="max-w-[180px] md:max-w-[220px] truncate cursor-pointer view-full-text" data-fulltext="${problemaTexto.replace(/"/g, '&quot;')}">${problemaDisplay}</div>
            </td>
            <td data-label="Solución" class="px-6 py-3 block md:table-cell text-left relative before:content-[attr(data-label)] before:font-bold before:block md:before:hidden before:text-custom-accent-primary before:mb-1">
                <div class="max-w-[180px] md:max-w-[220px] truncate cursor-pointer view-full-text" data-fulltext="${solucionTexto.replace(/"/g, '&quot;')}">${solucionDisplay}</div>
            </td>
            <td data-label="Estado" class="px-6 py-3 block md:table-cell text-left relative before:content-[attr(data-label)] before:font-bold before:block md:before:hidden before:text-custom-accent-primary before:mb-1">
                <select class="estado-select w-full min-w-[130px] md:min-w-[150px] bg-custom-bg-content-alt text-custom-text-primary px-3 py-2 border border-custom-border-separator rounded-elements focus:ring-2 focus:ring-custom-accent-primary outline-none appearance-none" 
                        data-reporte-id="${reporte.key}"
                        style="background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20fill%3D%22%23a0a0a5%22%3E%3Cpath%20d%3D%22M5%208l5%205%205-5z%22%2F%3E%3C%2Fsvg%3E'); background-repeat: no-repeat; background-position: right 0.5rem center; background-size: 1em;">
                    <option value="Pendiente" ${ (estadoActualNormalizado === 'pendiente' || estadoActualNormalizado === null) ? 'selected' : ''} class="bg-custom-bg-content-alt">Pendiente</option>
                    <option value="En progreso" ${estadoActualNormalizado === 'en progreso' ? 'selected' : ''} class="bg-custom-bg-content-alt">En progreso</option>
                    <option value="Resuelto" ${estadoActualNormalizado === 'resuelto' ? 'selected' : ''} class="bg-custom-bg-content-alt">Resuelto</option>
                </select>
            </td>
            <td data-label="Acción" class="px-6 py-3 block md:table-cell text-left md:text-center relative before:content-[attr(data-label)] before:font-bold before:block md:before:hidden before:text-custom-accent-primary before:mb-1 min-w-[140px]">
                <div class="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-2 justify-center items-stretch md:items-center">
                    <button class="btn-guardar bg-custom-accent-primary hover:bg-custom-accent-hover text-custom-text-on-accent font-semibold py-2 px-3 rounded-elements shadow-md hover:shadow-lg transition-all duration-200 text-xs" 
                            data-reporte-id="${reporte.key}" style="box-shadow: 0 0 0px var(--shadow-button);">Guardar</button>
                    <button class="btn-eliminar bg-red-600 hover:bg-red-700 text-custom-text-on-accent font-semibold py-2 px-3 rounded-elements shadow-md hover:shadow-lg transition-all duration-200 text-xs"
                            data-reporte-id="${reporte.key}">Eliminar</button>
                </div>
            </td>
        `;
        targetNode.appendChild(fila);
    });
    
    const newGuardarButtons = append ? targetNode.querySelectorAll(`tr:nth-last-child(-n+${reportesParaEstaPagina.length}) .btn-guardar`) : tablaReportes.querySelectorAll('.btn-guardar');
    const newEliminarButtons = append ? targetNode.querySelectorAll(`tr:nth-last-child(-n+${reportesParaEstaPagina.length}) .btn-eliminar`) : tablaReportes.querySelectorAll('.btn-eliminar');

    newGuardarButtons.forEach(button => {
        if (!button.hasAttribute('data-listener-attached')) {
            button.addEventListener('click', function() { 
                const reporteId = this.dataset.reporteId;
                actualizarReporte(reporteId);
            });
            button.setAttribute('data-listener-attached', 'true');
        }
    });
    newEliminarButtons.forEach(button => {
         if (!button.hasAttribute('data-listener-attached')) {
            button.addEventListener('click', function() { 
                const reporteId = this.dataset.reporteId;
                eliminarReporte(reporteId);
            });
            button.setAttribute('data-listener-attached', 'true');
        }
    });


    const totalItemsMostrados = reportesFiltradosMostrados.length;

    if (tablaReportesHead) { 
        if (totalItemsMostrados === 0 && ( (todosLosReportes.length > 0 && !append) || (todosLosReportes.length === 0 && !append) ) ) {
            tablaReportesHead.classList.add('hidden');
        } else {
            tablaReportesHead.classList.remove('hidden');
            if (!tablaReportesHead.classList.contains('md:table-header-group')) {
                tablaReportesHead.classList.add('md:table-header-group');
            }
        }
    }


    if (totalItemsMostrados >= reportesFiltrados.length) {
        if(btnCargarMas) btnCargarMas.style.display = 'none';
    } else {
        if(btnCargarMas) btnCargarMas.style.display = 'inline-block';
    }

    if(totalItemsMostrados === 0 && todosLosReportes.length > 0 && !append) {
         if(tablaReportes) tablaReportes.innerHTML = `<tr><td colspan="9" class="text-center py-10 text-custom-text-secondary">No se encontraron reportes que coincidan con la búsqueda o filtro.</td></tr>`; // Updated colspan to 9
         if(btnCargarMas) btnCargarMas.style.display = 'none';
    } else if (todosLosReportes.length === 0 && !append) {
        if(tablaReportes) tablaReportes.innerHTML = `<tr><td colspan="9" class="text-center py-10 text-custom-text-secondary">Aún no hay reportes registrados.</td></tr>`; // Updated colspan to 9
        if(btnCargarMas) btnCargarMas.style.display = 'none';
    }
}

function actualizarReporte(reporteId) {
    const selectElement = tablaReportes.querySelector(`.estado-select[data-reporte-id="${reporteId}"]`);
    if (!selectElement) {
        console.error("Could not find select element for report:", reporteId);
        showToast("Error al encontrar el selector de estado.", "error");
        return;
    }
    const nuevoEstado = selectElement.value; 
    const reporteRefDB = ref(database, `reportes/${reporteId}`);
    
    const currentReport = todosLosReportes.find(r => r.key === reporteId);
    const currentSolution = currentReport ? currentReport.solucion : '';
    const displayId = reporteId && typeof reporteId === 'string' && reporteId.length > 0 ? reporteId.substring(0,8) : 'DESCONOCIDO';


    const solutionPromptContainer = document.createElement('div');
    solutionPromptContainer.className = 'modal-backdrop active'; 
    solutionPromptContainer.innerHTML = `
        <div class="modal-content"> 
            <h3 class="text-xl font-semibold text-custom-text-primary mb-4">Anotar Solución Aplicada</h3>
            <p class="text-custom-text-secondary mb-2">Para el reporte (ID: ${displayId}...). Estado nuevo: ${nuevoEstado}</p>
            <textarea id="solucionInput" class="w-full bg-custom-bg-content-alt text-custom-text-primary placeholder-custom-text-secondary px-3 py-2 border border-custom-border-separator rounded-elements focus:ring-2 focus:ring-custom-accent-primary outline-none h-24 resize-none" placeholder="Describe la solución... (opcional)">${currentSolution || ''}</textarea>
            <div class="flex justify-end gap-3 mt-6">
                <button id="promptCancel" class="px-4 py-2 bg-custom-bg-content-alt hover:bg-opacity-75 text-custom-text-primary rounded-elements transition-colors">Cancelar</button>
                <button id="promptConfirm" class="px-4 py-2 bg-custom-accent-primary hover:bg-custom-accent-hover text-custom-text-on-accent rounded-elements transition-colors">Guardar Cambios</button>
            </div>
        </div>
    `;
    document.body.appendChild(solutionPromptContainer);

    const solucionInput = solutionPromptContainer.querySelector('#solucionInput');
    solucionInput.focus(); 

    solutionPromptContainer.querySelector('#promptConfirm').addEventListener('click', () => {
        const solucionAplicada = solucionInput.value.trim();
        update(reporteRefDB, { estado: nuevoEstado, solucion: solucionAplicada }) 
            .then(() => {
                showToast("✅ Reporte actualizado correctamente.", "success");
            })
            .catch((error) => {
                console.error("Error al actualizar:", error);
                showToast("Error al actualizar el reporte.", "error");
            });
        document.body.removeChild(solutionPromptContainer);
    });

    solutionPromptContainer.querySelector('#promptCancel').addEventListener('click', () => {
        document.body.removeChild(solutionPromptContainer);
    });
}

function eliminarReporte(reporteId) {
    const displayId = reporteId && typeof reporteId === 'string' && reporteId.length > 0 ? reporteId.substring(0,8) : 'DESCONOCIDO';
    showConfirmationModal(
        "Confirmar Eliminación",
        `¿Estás seguro de que deseas eliminar este reporte (ID: ${displayId}...)? Esta acción no se puede deshacer.`,
        () => {
            const reporteRefDB = ref(database, `reportes/${reporteId}`);
            remove(reporteRefDB)
                .then(() => {
                    showToast("🗑️ Reporte eliminado correctamente.", "success");
                })
                .catch((error) => {
                    console.error("Error al eliminar:", error);
                    showToast("Error al eliminar el reporte.", "error");
                });
        }
    );
}


    
