document.addEventListener('DOMContentLoaded', async () => {

    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = '/login';
        return;
    }

    // מצב הארנה: רשימת היינות, יינות שנדחו ומיקום הכרטיס הנוכחי.
    let winesToShow = [];
    let dislikedWines = [];
    let currentIndex = 0;
    let isSwiping = false;

    const cardElement = document.getElementById('wine-card');
    const imgEl = document.getElementById('wine-img');
    const nameEl = document.getElementById('wine-name');
    const wineryYearEl = document.getElementById('wine-winery-year');

    const btnLike = document.getElementById('btn-like');
    const btnDislike = document.getElementById('btn-dislike');
    const emptyState = document.getElementById('empty-state');

    // שמות מחלקות העיצוב של הדרגות, כדי להחליף צבע בצורה מסודרת.
    const levelClassNames = [
        'level-casual-sipper',
        'level-curious-taster',
        'level-wine-lover',
        'level-vintage-expert',
        'level-master-of-wine'
    ];

    const getLevelClass = (level) => {
        return 'level-' + String(level || 'Casual Sipper')
            .toLowerCase()
            .replaceAll(' ', '-');
    };

    const applyLevelStyle = (levelEl, level) => {
        if (window.applyWinederLevelStyle) {
            window.applyWinederLevelStyle(levelEl, level);
            return;
        }

        if (!levelEl) return;
        levelEl.classList.add('level-badge');
        levelEl.classList.remove(...levelClassNames);
        levelEl.classList.add(getLevelClass(level));
    };

    // מציג ליד הניקוד תוספת רגעית כמו +2 או +50.
    const showPointsPop = (amount) => {
        const pointsEl = document.getElementById('nav-points');
        if (!pointsEl || !pointsEl.parentElement) return;

        pointsEl.parentElement.style.position = 'relative';

        const pop = document.createElement('span');
        pop.className = 'points-pop';
        pop.textContent = `+${amount}`;
        pointsEl.parentElement.appendChild(pop);

        setTimeout(() => pop.remove(), 1200);
    };

    // יוצר הודעה קטנה על המסך בלי לעצור את השימוש בעמוד.
    const showGameToast = (title, message, className = '') => {
        const toast = document.createElement('div');
        toast.className = `game-toast ${className}`;
        toast.innerHTML = `
            <button class="game-toast-close" type="button" aria-label="Close">×</button>
            <div class="game-toast-title">${title}</div>
            <div class="game-toast-message">${message}</div>
        `;

        document.body.appendChild(toast);

        toast.querySelector('.game-toast-close').addEventListener('click', () => toast.remove());
        setTimeout(() => toast.classList.add('show'), 20);
        setTimeout(() => toast.remove(), 4500);
    };

    // יוצר קונפטי כאשר המשתמש משלים יעד או מקבל בונוס.
    const launchConfetti = () => {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-container';

        for (let i = 0; i < 70; i++) {
            const piece = document.createElement('span');
            piece.className = 'confetti-piece';
            piece.style.left = `${Math.random() * 100}%`;
            piece.style.animationDelay = `${Math.random() * 0.7}s`;
            piece.style.animationDuration = `${2 + Math.random() * 1.5}s`;
            piece.style.transform = `rotate(${Math.random() * 360}deg)`;
            confetti.appendChild(piece);
        }

        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 4000);
    };

    // חגיגה קצרה כאשר מגיעים לחמש החלקות באותו יום.
    const showDailyGoalCelebration = (bonusPoints) => {
        launchConfetti();
        showPointsPop(bonusPoints);
        showGameToast(
            'Bonus Unlocked!',
            `+${bonusPoints} points added 🎉`,
            'daily-goal-toast'
        );
    };

    const showLevelUpMessage = (newLevel) => {
        showGameToast(
            'Level Up!',
            `You advanced to ${newLevel} 🏆`,
            'level-up-toast'
        );
    };

    // עדכון הניקוד, הדרגה והיעד היומי בזמן אמת
    const updateGamificationUI = (stats) => {
        const pointsEl = document.getElementById('nav-points');
        const streakEl = document.getElementById('nav-streak');
        const levelEl = document.getElementById('nav-level');
        const countEl = document.getElementById('daily-swipes-count');
        const progressEl = document.getElementById('daily-progress-bar');
        const dailyProgressContainer = document.querySelector('.daily-progress-container');
        const dailyCount = Number(stats.dailySwipesCount) || 0;

        if (pointsEl) pointsEl.textContent = stats.points;
        if (window.updateWinederLevelProgress) window.updateWinederLevelProgress(stats.points);
        if (streakEl) streakEl.textContent = stats.streak;
        if (levelEl) {
            levelEl.textContent = stats.level;
            applyLevelStyle(levelEl, stats.level);
        }
        if (countEl) countEl.textContent = stats.dailySwipesCount;

        if (dailyProgressContainer) {
            dailyProgressContainer.style.display = dailyCount >= 5 ? 'none' : '';
        }

        if (progressEl) {
            let percent = (dailyCount / 5) * 100;
            if (percent > 100) percent = 100;
            progressEl.style.width = percent + '%';
            progressEl.setAttribute('aria-valuenow', Math.min(dailyCount, 5));
        }

        localStorage.setItem('points', stats.points);
        localStorage.setItem('level', stats.level);
        localStorage.setItem('streak', stats.streak);
        localStorage.setItem('dailySwipesCount', stats.dailySwipesCount);
    };

    updateGamificationUI({
        points: localStorage.getItem('points') || 0,
        streak: localStorage.getItem('streak') || 0,
        level: localStorage.getItem('level') || 'Casual Sipper',
        dailySwipesCount: localStorage.getItem('dailySwipesCount') || 0
    });

    const reportSwipe = async () => {
        try {
            const res = await fetch('/swipe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: currentUser })
            });

            if (!res.ok) return;

            const newStats = await res.json();

            updateGamificationUI(newStats);

            // כל החלקה מוסיפה נקודות ומציגה תוספת קטנה ליד הניקוד
            showPointsPop(newStats.pointsDelta || 2);

            // הבונוס היומי מופיע רק כאשר מגיעים בדיוק לחמש החלקות
            if (newStats.dailyGoalCompleted && newStats.bonusPoints > 0) {
                showDailyGoalCelebration(newStats.bonusPoints);
            }

            if (newStats.levelUp) {
                showLevelUpMessage(newStats.level);
            }

        } catch(e) {
            console.log("Error reporting swipe", e);
        }
    };

    const loadWinesFromServer = async () => {
        try {
            // מבקשים מהשרת רק יינות שעדיין לא נמצאים במרתף של המשתמש
            const response = await fetch(`/arena-wines?email=${encodeURIComponent(currentUser)}`);
            const wines = await response.json();

            if (!response.ok) {
                console.log("Could not load arena wines.");
                return;
            }

            winesToShow = wines;
            renderWine();
        } catch (error) {
            console.log("Error:", error);
        }
    };

    const renderWine = () => {

        if (currentIndex >= winesToShow.length) {
            cardElement.style.display = 'none';
            emptyState.style.display = 'flex';

            const btnRetry = document.getElementById('btn-retry-dislikes');

            // אם נשארו יינות שנדחו, מאפשרים לעבור עליהם שוב
            if (dislikedWines.length > 0 && btnRetry) {
                btnRetry.style.display = 'block';

                btnRetry.onclick = () => {
                    // מעבירים את היינות שנדחו לסיבוב נוסף ומתחילים מהכרטיס הראשון.
                    winesToShow = [...dislikedWines];
                    dislikedWines = [];
                    currentIndex = 0;

                    emptyState.style.display = 'none';
                    cardElement.style.display = 'flex';
                    renderWine();
                };
            } else if (btnRetry) {
                btnRetry.style.display = 'none';
            }
            return;
        }

        const wine = winesToShow[currentIndex];
        imgEl.src = wine.image || '../images/wine_images/default-wine.png';
        imgEl.onerror = function () { this.onerror = null; this.src = '../images/wine_images/default-wine.png'; };
        nameEl.textContent = wine.name;
        wineryYearEl.textContent = `${wine.winery} | ${wine.year || ''}`;
    };

    const saveToCellar = async (wine) => {
        try {
            const response = await fetch('/cellar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: currentUser, wineId: wine.id })
            });

            if (!response.ok) {
                const data = await response.json();
                console.log(data.message || "Could not save wine.");
            }
        } catch (error) {
            console.log("Error saving wine", error);
        }
    };

    // טיפול בלחיצה על אהבתי או לא אהבתי, כולל שמירה במרתף ודיווח נקודות.
    const handleSwipe = async (direction) => {
        if (isSwiping) return;

        const currentWine = winesToShow[currentIndex];
        if (!currentWine) return;

        isSwiping = true;
        btnLike.disabled = true;
        btnDislike.disabled = true;

        if (direction === 'like') {
            cardElement.classList.add('swipe-right');
            await saveToCellar(currentWine);
        } else {
            cardElement.classList.add('swipe-left');
            dislikedWines.push(currentWine);
        }

        // דיווח לשרת על ההחלקה כדי לעדכן את הניקוד
        reportSwipe();

        setTimeout(() => {
            currentIndex++;
            cardElement.classList.remove('swipe-right', 'swipe-left');
            renderWine();

            btnLike.disabled = false;
            btnDislike.disabled = false;
            isSwiping = false;
        }, 400);
    };

    btnLike.addEventListener('click', () => handleSwipe('like'));
    btnDislike.addEventListener('click', () => handleSwipe('dislike'));

    await loadWinesFromServer();
});
