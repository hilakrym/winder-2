document.addEventListener('DOMContentLoaded', async () => {


    // בדיקה שהמשתמש מחובר
    const currentUser = localStorage.getItem('currentUser');


    if (!currentUser) {
        window.location.href = '/login';
        return;
    }


    // מערך היינות שיגיע מהשרת
    let winesToShow = [];
    let currentIndex = 0;


    // הגדרת אלמנטים ב-DOM
    const cardElement = document.getElementById('wine-card');
    const imgEl = document.getElementById('wine-img');
    const nameEl = document.getElementById('wine-name');
    const wineryYearEl = document.getElementById('wine-winery-year');
    const descEl = document.getElementById('wine-desc');
    const tagsEl = document.getElementById('wine-tags');


    const btnLike = document.getElementById('btn-like');
    const btnDislike = document.getElementById('btn-dislike');


    const cardArea = document.getElementById('card-area');
    const emptyState = document.getElementById('empty-state');


    // שליפת היינות מהשרת במקום מערך hard-coded
    const loadWinesFromServer = async () => {
        try {
            const response = await fetch('/wines');
            const wines = await response.json();


            if (!response.ok) {
                alert("Could not load wines.");
                return;
            }


            winesToShow = wines;


            // ערבוב אקראי
            winesToShow.sort(() => Math.random() - 0.5);


            renderWine();


        } catch (error) {
            console.log("Error loading wines:", error);
            alert("Something went wrong while loading wines.");
        }
    };


    // פונקציה להצגת יין בכרטיסייה
    const renderWine = () => {
        if (currentIndex >= winesToShow.length) {
            cardArea.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }


        const wine = winesToShow[currentIndex];


        imgEl.src = wine.image || '../images/wine_images/default-wine.png';
        imgEl.onerror = function () {
            this.onerror = null;
            this.src = '../images/wine_images/default-wine.png';
        };


        nameEl.textContent = wine.name;
        wineryYearEl.textContent = `${wine.winery} | ${wine.year || ''}`;


        // כרגע בטבלת wines אין desc/sweetness, אז נותנים טקסט ברירת מחדל
        descEl.textContent = wine.desc || "A selected wine from the Wineder collection.";


        tagsEl.innerHTML = `
            <span class="tag">${wine.type || 'Wine'}</span>
        `;
    };


    // שמירת יין למרתף דרך השרת
    const saveToCellar = async (wine) => {
        try {
            const response = await fetch('/cellar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userEmail: currentUser,
                    wineId: wine.id
                })
            });


            const data = await response.json();


            if (!response.ok) {
                // אם היין כבר קיים במרתף, לא נעצור את החוויה
                console.log(data.message || "Could not save wine.");
                return;
            }


            console.log("Wine saved to cellar:", wine.name);


        } catch (error) {
            console.log("Error saving wine to cellar:", error);
        }
    };


    // פונקציה שמטפלת באנימציית ההחלקה ובשמירה למרתף
    const handleSwipe = async (direction) => {
        const currentWine = winesToShow[currentIndex];


        if (!currentWine) return;


        if (direction === 'like') {
            cardElement.classList.add('swipe-right');
            await saveToCellar(currentWine);
        } else {
            cardElement.classList.add('swipe-left');
        }


        setTimeout(() => {
            currentIndex++;
            cardElement.classList.remove('swipe-right', 'swipe-left');
            renderWine();
        }, 400);
    };


    // מאזינים ללחיצות
    btnLike.addEventListener('click', () => handleSwipe('like'));
    btnDislike.addEventListener('click', () => handleSwipe('dislike'));


    // טעינה ראשונית של יינות מה-DB
    await loadWinesFromServer();
});




