document.addEventListener('DOMContentLoaded', async () => {


    const currentUser = localStorage.getItem('currentUser');
    const firstName = localStorage.getItem('firstName');


    if (!currentUser) {
        window.location.href = '/login';
        return;
    }


    const gridEl = document.getElementById('cellar-grid');
    const emptyStateEl = document.getElementById('empty-state');
    const titleEl = document.getElementById('cellar-title');


    if (firstName) {
        titleEl.textContent = `${firstName}'s Cellar`;
    } else {
        const namePart = currentUser.split('@')[0];
        const capitalizedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        titleEl.textContent = `${capitalizedName}'s Cellar`;
    }


    let myCellar = [];


    let currentState = {
        searchText: '',
        activeType: 'all',
        filterYear: 'all',
        filterWinery: 'all'
    };


    const loadCellarFromServer = async () => {
        try {
            const response = await fetch(`/cellar/${encodeURIComponent(currentUser)}`);
            const data = await response.json();


            if (!response.ok) {
                alert(data.message || "Could not load cellar.");
                return;
            }


            myCellar = data;
            populateFilters(myCellar);
            renderCellar();


        } catch (error) {
            console.log("Error loading cellar:", error);
            alert("Something went wrong while loading your cellar.");
        }
    };


    const populateFilters = (cellarWines) => {
        const yearList = document.getElementById('yearDropdown');
        const wineryList = document.getElementById('wineryDropdown');


        yearList.innerHTML = '<li><a class="dropdown-item" href="#" data-value="all">All Years</a></li>';
        wineryList.innerHTML = '<li><a class="dropdown-item" href="#" data-value="all">All Wineries</a></li>';


        [...new Set(cellarWines.map(w => w.year).filter(Boolean))]
            .sort((a, b) => b - a)
            .forEach(y => {
                yearList.innerHTML += `<li><a class="dropdown-item" href="#" data-value="${y}">${y}</a></li>`;
            });


        [...new Set(cellarWines.map(w => w.winery).filter(Boolean))]
            .sort()
            .forEach(w => {
                wineryList.innerHTML += `<li><a class="dropdown-item" href="#" data-value="${w}">${w}</a></li>`;
            });


        document.querySelectorAll('.dropdown-menu .dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();


                const selectedValue = e.target.getAttribute('data-value');
                const parentUl = e.target.closest('ul');


                if (parentUl.id === 'yearDropdown') {
                    currentState.filterYear = selectedValue;
                    document.getElementById('yearBtn').textContent =
                        selectedValue === 'all' ? 'Year' : `Year: ${selectedValue}`;
                } else {
                    currentState.filterWinery = selectedValue;
                    document.getElementById('wineryBtn').textContent =
                        selectedValue === 'all' ? 'Winery' : `Winery: ${selectedValue}`;
                }


                renderCellar();
            });
        });
    };


    const renderCellar = () => {
        let filteredWines = myCellar.filter(wine => {
            const matchesSearch = wine.name.toLowerCase().includes(currentState.searchText.toLowerCase());
            const normalizedWineType = (wine.type || '').toLowerCase().replace('é', 'e');
            const matchesType = currentState.activeType === 'all' || normalizedWineType === currentState.activeType;
            const matchesYear = currentState.filterYear === 'all' || String(wine.year) === currentState.filterYear;
            const matchesWinery = currentState.filterWinery === 'all' || wine.winery === currentState.filterWinery;


            return matchesSearch && matchesType && matchesYear && matchesWinery;
        });


        filteredWines.sort((a, b) => a.name.localeCompare(b.name));


        gridEl.innerHTML = '';


        if (filteredWines.length === 0) {
            gridEl.style.display = 'none';


            if (myCellar.length === 0) {
                emptyStateEl.style.display = 'block';
            } else {
                emptyStateEl.style.display = 'none';
            }


            return;
        }


        emptyStateEl.style.display = 'none';
        gridEl.style.display = 'grid';


        filteredWines.forEach(wine => {
            const card = document.createElement('div');
            card.classList.add('mini-wine-card');


            card.innerHTML = `
                <button 
                    class="btn-remove" 
                    data-id="${wine.id}" 
                    data-source="${wine.source}" 
                    title="Remove from cellar">
                    🗑️
                </button>


                <img src="${wine.image || '../images/wine_images/default-wine.png'}"
                     alt="${wine.name}"
                     class="mini-wine-img"
                     onerror="this.onerror=null; this.src='../images/wine_images/default-wine.png';">


                <div class="mini-wine-info">
                    <h3 class="mini-wine-name">${wine.name}</h3>
                    <p class="mini-wine-winery">${wine.winery} | ${wine.year || ''}</p>
                </div>
            `;


            gridEl.appendChild(card);
        });


        attachRemoveListeners();
    };


    const removeWine = async (wineId, source) => {
        try {
            let url = '/cellar';


            if (source === 'custom') {
                url = '/custom-wine';
            }


            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userEmail: currentUser,
                    wineId: wineId
                })
            });


            const data = await response.json();


            if (!response.ok) {
                alert(data.message || "Could not remove wine.");
                return;
            }


            myCellar = myCellar.filter(wine => {
                return !(String(wine.id) === String(wineId) && wine.source === source);
            });


            populateFilters(myCellar);
            renderCellar();


        } catch (error) {
            console.log("Error removing wine:", error);
            alert("Something went wrong while removing the wine.");
        }
    };


    const attachRemoveListeners = () => {
        document.querySelectorAll('.btn-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const wineId = e.currentTarget.getAttribute('data-id');
                const source = e.currentTarget.getAttribute('data-source');


                removeWine(wineId, source);
            });
        });
    };


    const attachFiltersEvents = () => {
        document.getElementById('searchInput').addEventListener('input', (e) => {
            currentState.searchText = e.target.value;
            renderCellar();
        });


        document.querySelectorAll('.chip[data-type]').forEach(chip => {
            chip.addEventListener('click', (e) => {
                document.querySelector('.chip.active').classList.remove('active');
                e.target.classList.add('active');
                currentState.activeType = e.target.getAttribute('data-type');
                renderCellar();
            });
        });
    };


    window.showAddWineModal = () => {
        document.getElementById('addWineForm').reset();
        document.getElementById('addWineModal').style.display = 'flex';
    };


    window.closeAddWineModal = () => {
        document.getElementById('addWineModal').style.display = 'none';
    };


    window.saveNewWine = async (event) => {
        event.preventDefault();


        const name = document.getElementById('newWineName').value.trim();
        const winery = document.getElementById('newWineWinery').value.trim();
        const year = parseInt(document.getElementById('newWineYear').value);
        const type = document.getElementById('newWineType').value;
        const inputImage = document.getElementById('newWineImage').value.trim();


        const englishRegex = /^[A-Za-z0-9\s\-,.'&]+$/;


        if (!englishRegex.test(name) || !englishRegex.test(winery)) {
            alert("Please use English characters only for Name and Winery.");
            return;
        }


        const currentYear = new Date().getFullYear();


        if (year < 1800 || year > currentYear + 1) {
            alert(`Please enter a valid year (1800 - ${currentYear + 1}).`);
            return;
        }


        const finalImage = inputImage || '../images/wine_images/default-wine.png';


        try {
            const response = await fetch('/custom-wine', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userEmail: currentUser,
                    name,
                    winery,
                    year,
                    type,
                    image: finalImage
                })
            });


            const data = await response.json();


            if (!response.ok) {
                alert(data.message || "Could not add custom wine.");
                return;
            }


            closeAddWineModal();


            await loadCellarFromServer();


        } catch (error) {
            console.log("Error adding custom wine:", error);
            alert("Something went wrong while adding the wine.");
        }
    };


    attachFiltersEvents();
    await loadCellarFromServer();
});




