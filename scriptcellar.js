// מוודא שכל העמוד סיים להיטען לפני שהקוד מתחיל לרוץ, כדי למנוע שגיאות בזיהוי אלמנטים.
document.addEventListener('DOMContentLoaded', () => {
    
    // שליפת המשתמש המחובר מהזיכרון ובניית מפתח השליפה הייחודי למרתף שלו
    const currentUser = localStorage.getItem('currentUser');
    const storageKey = `cellar_${currentUser}`;
    
    // בחירת אלמנט הכותרת מהדום כדי שנוכל לעדכן בו את שם המשתמש בהמשך.
    const titleEl = document.getElementById('cellar-title');
    
    // חיתוך השם מהאימייל ועיצובו
    if (currentUser) {
        const namePart = currentUser.split('@')[0];
        const capitalizedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        titleEl.textContent = `${capitalizedName}'s Cellar`;
    }

    // מציאת אלמנט הגריד ואלמנט המצב הריק בדום ושמירתם במשתנים
    const gridEl = document.getElementById('cellar-grid');
    const emptyStateEl = document.getElementById('empty-state');

    // פונקציה שאחראית לבנות ולהציג את כל היינות השמורים בעמוד המרתף
    const renderCellar = () => {
        // שולפים את המרתף המעודכן מהזיכרון של הדפדפן
        let myCellar = JSON.parse(localStorage.getItem(storageKey)) || [];

        // איפוס התצוגה - מחיקת כל הכרטיסיות הישנות
        gridEl.innerHTML = '';

        // בודקים אם המרתף ריק
        if (myCellar.length === 0) {
            gridEl.style.display = 'none';
            emptyStateEl.style.display = 'block';
            return;
        }

        // אם יש יינות, מסתירים את המצב הריק ומציגים את הגריד
        emptyStateEl.style.display = 'none';
        gridEl.style.display = 'grid';

        // לולאה שעוברת על כל יין ברשימה ויוצרת עבורו כרטיסייה
        myCellar.forEach(wine => {
            const card = document.createElement('div');
            card.classList.add('mini-wine-card');
            
            card.innerHTML = `
                <button class="btn-remove" data-id="${wine.id}" title="Remove from cellar">🗑️</button>
                <img src="${wine.image}" alt="${wine.name}" class="mini-wine-img">
                <div class="mini-wine-info">
                    <h3 class="mini-wine-name">${wine.name}</h3>
                    <p class="mini-wine-winery">${wine.winery} | ${wine.year}</p>
                </div>
            `;

            gridEl.appendChild(card);
        });

        // חיבור מחדש של מאזיני המחיקה לכל כפתור חדש שנוצר
        attachRemoveListeners();
    };

    // פונקציה לטיפול במחיקת יין
    const removeWine = (wineId) => {
        let myCellar = JSON.parse(localStorage.getItem(storageKey)) || [];
        myCellar = myCellar.filter(wine => wine.id !== wineId);
        localStorage.setItem(storageKey, JSON.stringify(myCellar));
        renderCellar();
    };

    // פונקציה לחיבור אירועי הלחיצה לכפתורי הפח
    const attachRemoveListeners = () => {
        const removeButtons = document.querySelectorAll('.btn-remove');
        removeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const wineId = e.target.getAttribute('data-id');
                removeWine(wineId);
            });
        });
    };

    // הפעלה ראשונית של בניית המרתף
    renderCellar();
});