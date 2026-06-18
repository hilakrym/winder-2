// מוודא שכל העמוד סיים להיטען לפני שהקוד מתחיל לרוץ, כדי למנוע שגיאות בזיהוי אלמנטים.
document.addEventListener('DOMContentLoaded', () => {
    
    // מסד נתונים של היינות (נוצר בקוד ולא בבסיס נתונים בשלב זה לטובת הבדיקה)
    const winesDB = [
        {
            id: "wine_1",
            name: "Yarden Syrah",
            winery: "Golan Heights Winery",
            year: 2020,
            type: "Red",
            sweetness: "Dry",
            desc: "A rich red wine with aromas of black berries, spices, and a hint of chocolate.",
            image: "wine_images/syrah.jpg"
        },
        {
            id: "wine_2",
            name: "Mt. Amasa",
            winery: "Yatir",
            year: 2019,
            type: "Red",
            sweetness: "Dry",
            desc: "Elegant and complex, featuring notes of ripe plum, forest floor, and vanilla.",
            image: "wine_images/amasa.jpg"
        },
        {
            id: "wine_3",
            name: "Galil Mountain Rosé",
            winery: "Galil Mountain",
            year: 2022,
            type: "Rosé",
            sweetness: "Dry",
            desc: "Crisp and refreshing with vibrant flavors of fresh strawberries and citrus.",
            image: "wine_images/rose.jpg"
        },
        {
            id: "wine_4",
            name: "Sauvignon Blanc",
            winery: "Pelter",
            year: 2021,
            type: "White",
            sweetness: "Dry",
            desc: "Highly aromatic with sharp tropical fruit notes and a refreshing acidic finish.",
            image: "wine_images/sauvignon.jpg"
        },
        {
            id: "wine_5",
            name: "Yarden Chardonnay",
            winery: "Golan Heights Winery",
            year: 2021,
            type: "White",
            sweetness: "Dry",
            desc: "Full-bodied white with layers of pear, melon, and rich buttery oak.",
            image: "wine_images/chardonnay.jpg"
        }
    ];

    //  ניצור עותק של מערך היינות
    let winesToShow = winesDB.slice(); 
    // ערבוב אקראי של המערך 
    winesToShow.sort(() => Math.random() - 0.5);
    let currentIndex = 0;

    // הגדרת אלמנטים ב DOM
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

    // פונקציה להצגת יין בכרטיסייה
    const renderWine = () => {
        // אם נגמרו היינות להציג
        if (currentIndex >= winesToShow.length) {
            cardArea.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        // שליפת נתוני היין שהוגרל מתוך מערך היינות לפי האינדקס שלו
        const wine = winesToShow[currentIndex];
        // עדכון הנתונים של היין הנבחר בDOM
        imgEl.src = wine.image;
        nameEl.textContent = wine.name;
        wineryYearEl.textContent = `${wine.winery} | ${wine.year}`;
        descEl.textContent = wine.desc;

        // יצירת התגיות
        tagsEl.innerHTML = `
            <span class="tag">${wine.type}</span>
            <span class="tag">${wine.sweetness}</span>
        `;
    };

    //  פונקציה שמטפלת באנימציית ההחלקה ובשמירה למרתף
    const handleSwipe = (direction) => {
        const currentWine = winesToShow[currentIndex];

        // מוסיף מחלקה של אנימציה ימינה או שמאלה
        if (direction === 'like') {
            cardElement.classList.add('swipe-right');
            saveToCellar(currentWine); // שמירה למרתף
        } else {
            cardElement.classList.add('swipe-left');
        }

        // ממתינים 0.4 שהאנימציה תסתיים, ואז מחליפים ליין הבא
        setTimeout(() => {
            currentIndex++; // קידום האינדקס
            cardElement.classList.remove('swipe-right', 'swipe-left'); // איפוס אנימציה
            renderWine(); // ציור היין הבא
        }, 400); 
    };

    // פונקציה לשמירת יין ב"מרתף שלי" (מותאם אישית למשתמש)
    const saveToCellar = (wine) => {
        // זיהוי המשתמש המחובק 
        const currentUser = localStorage.getItem('currentUser') ;
        
        // יצירת מפתח ייחודי למשתמש תחתו ישמר מערך היינות שהמשתמש בחר במערך JSON
        const storageKey = `cellar_${currentUser}`;

        //  שליפת הערך המתאים למפתח המשתמש שישלוף את המרתף הסצפיפי של המשתמש, אם אין ניצור מערך ריק
        let myCellar = JSON.parse(localStorage.getItem(storageKey)) || [];
        
        //  נוודא שהיין לא קיים כבר במרתף (כדי למנוע כפילויות אם הוא יעשה שוב לייק בעתיד)
        const exists = myCellar.find(w => w.id === wine.id);
        //אם היין לא נמצא במערך נוסיף אותו
        if (!exists) {
            myCellar.push(wine);
            //  הופכים את רשימת היינות לטקסט, כי הזיכרון של הדפדפן יודע לשמור רק טקסט פשוט
            localStorage.setItem(storageKey, JSON.stringify(myCellar));
        }
    };

    // מאזין ללחיצות על הכפתורים
    btnLike.addEventListener('click', () => handleSwipe('like'));
    btnDislike.addEventListener('click', () => handleSwipe('dislike'));

    // קריאה ראשונה לציור הכרטיסייה כשהעמוד נטען
    renderWine();
});