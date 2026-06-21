document.addEventListener('DOMContentLoaded', () => {
    
    const currentUser = localStorage.getItem('currentUser');
    const storageKey = `cellar_${currentUser}`;
    const gridEl = document.getElementById('cellar-grid');
    const emptyStateEl = document.getElementById('empty-state');
    const titleEl = document.getElementById('cellar-title');
    
    if (currentUser) {
        const namePart = currentUser.split('@')[0];
        const capitalizedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        titleEl.textContent = `${capitalizedName}'s Cellar`;
    }

    let currentState = {
        searchText: '',
        activeType: 'all',
        filterYear: 'all',
        filterWinery: 'all'
    };

    const populateFilters = (myCellar) => {
        const yearList = document.getElementById('yearDropdown');
        const wineryList = document.getElementById('wineryDropdown');
        
        yearList.innerHTML = '<li><a class="dropdown-item" href="#" data-value="all">All Years</a></li>';
        wineryList.innerHTML = '<li><a class="dropdown-item" href="#" data-value="all">All Wineries</a></li>';

        [...new Set(myCellar.map(w => w.year))].sort((a,b) => b-a).forEach(y => {
            yearList.innerHTML += `<li><a class="dropdown-item" href="#" data-value="${y}">${y}</a></li>`;
        });

        [...new Set(myCellar.map(w => w.winery))].sort().forEach(w => {
            wineryList.innerHTML += `<li><a class="dropdown-item" href="#" data-value="${w}">${w}</a></li>`;
        });

        document.querySelectorAll('.dropdown-menu .dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const selectedValue = e.target.getAttribute('data-value');
                const parentUl = e.target.closest('ul');
                
                if (parentUl.id === 'yearDropdown') {
                    currentState.filterYear = selectedValue;
                    document.getElementById('yearBtn').textContent = selectedValue === 'all' ? 'Year' : `Year: ${selectedValue}`;
                } else {
                    currentState.filterWinery = selectedValue;
                    document.getElementById('wineryBtn').textContent = selectedValue === 'all' ? 'Winery' : `Winery: ${selectedValue}`;
                }
                
                renderCellar();
            });
        });
    };

    const renderCellar = () => {
        let myCellar = JSON.parse(localStorage.getItem(storageKey)) || [];

        let filteredWines = myCellar.filter(wine => {
            const matchesSearch = wine.name.toLowerCase().includes(currentState.searchText.toLowerCase());
            const normalizedWineType = wine.type.toLowerCase().replace('é', 'e');
            const matchesType = currentState.activeType === 'all' || normalizedWineType === currentState.activeType;
            const matchesYear = currentState.filterYear === 'all' || wine.year.toString() === currentState.filterYear;
            const matchesWinery = currentState.filterWinery === 'all' || wine.winery === currentState.filterWinery;
            
            return matchesSearch && matchesType && matchesYear && matchesWinery;
        });

        filteredWines.sort((a, b) => a.name.localeCompare(b.name));

        gridEl.innerHTML = '';

        if (filteredWines.length === 0) {
            gridEl.style.display = 'none';
            if (myCellar.length === 0) {
                 emptyStateEl.style.display = 'block';
            }
            return;
        }

        emptyStateEl.style.display = 'none';
        gridEl.style.display = 'grid';

        filteredWines.forEach(wine => {
            const card = document.createElement('div');
            card.classList.add('mini-wine-card');
            
            // שימי לב: הוספנו כאן את ה-onerror למקרה שהקישור שבור, שיציג את תמונת הדיפולט מהתיקייה שלך
            card.innerHTML = `
                <button class="btn-remove" data-id="${wine.id}" title="Remove from cellar">🗑️</button>
                <img src="${wine.image}" alt="${wine.name}" class="mini-wine-img" onerror="this.onerror=null; this.src='wine_images/default-wine.png';">
                <div class="mini-wine-info">
                    <h3 class="mini-wine-name">${wine.name}</h3>
                    <p class="mini-wine-winery">${wine.winery} | ${wine.year}</p>
                </div>
            `;
            gridEl.appendChild(card);
        });

        attachRemoveListeners();
    };

    const removeWine = (wineId) => {
        let myCellar = JSON.parse(localStorage.getItem(storageKey)) || [];
        myCellar = myCellar.filter(wine => wine.id != wineId);
        localStorage.setItem(storageKey, JSON.stringify(myCellar));
        populateFilters(myCellar);
        renderCellar();
    };

    const attachRemoveListeners = () => {
        document.querySelectorAll('.btn-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                removeWine(e.target.getAttribute('data-id'));
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

    window.saveNewWine = (event) => {
        event.preventDefault();

        const name = document.getElementById('newWineName').value.trim();
        const winery = document.getElementById('newWineWinery').value.trim();
        const year = parseInt(document.getElementById('newWineYear').value);
        const type = document.getElementById('newWineType').value;
        const inputImage = document.getElementById('newWineImage').value.trim();

        // בדיקת אנגלית
        const englishRegex = /^[A-Za-z0-9\s\-,.'&]+$/;
        if (!englishRegex.test(name) || !englishRegex.test(winery)) {
            alert("Please use English characters only for Name and Winery.");
            return;
        }

        // בדיקת שנתון הגיוני
        const currentYear = new Date().getFullYear();
        if (year < 1800 || year > currentYear + 1) {
            alert(`Please enter a valid year (1800 - ${currentYear + 1}).`);
            return;
        }

        // שימוש בקישור שהוזן או בתמונת ברירת המחדל מהתיקייה שלך
        let finalImage = inputImage;
        if (!finalImage) {
            finalImage = 'wine_images/default-wine.png'; 
        }

        const newWine = {
            id: Date.now(),
            name: name,
            winery: winery,
            year: year,
            type: type,
            image: finalImage
        };

        let myCellar = JSON.parse(localStorage.getItem(storageKey)) || [];
        myCellar.push(newWine);
        localStorage.setItem(storageKey, JSON.stringify(myCellar));

        closeAddWineModal();
        populateFilters(myCellar);
        renderCellar();
    };

    // הפעלה ראשונה
    let initialCellar = JSON.parse(localStorage.getItem(storageKey)) || [];
    populateFilters(initialCellar);
    attachFiltersEvents();
    renderCellar();
});