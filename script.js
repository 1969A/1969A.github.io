/* =================================================================lement
   1. CONFIGURATION GLOBALE & DATE
   ================================================================ */
document.addEventListener('DOMContentLoaded', () => {
    // Mise à jour automatique de l'année dans le footer de toutes les pages
    const yearElements = document.querySelectorAll('#year-text');
    yearElements.forEach(el => {
        el.textContent = new Date().getFullYear();
    });

    // Date de dernière mise à jour (spécifique à cgu.html)
    const lastUpdateDate = document.getElementById('last-update-date');
    if (lastUpdateDate) {
        lastUpdateDate.textContent = new Date().toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }
});


/* =================================================================
   2. ANIMATION DES PARTICULES (Canvas - Commun à toutes les pages)
   ================================================================ */
const canvas = document.getElementById('particles-canvas');
if (canvas) {
    const ctx = canvas.getContext('2d');

    let particlesArray = [];
    let canvasWidth = window.innerWidth;
    let canvasHeight = window.innerHeight;

    function resizeCanvas() {
        canvasWidth = window.innerWidth;
        canvasHeight = window.innerHeight;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
    }
    window.addEventListener('resize', () => {
        resizeCanvas();
        initParticles();
    });
    resizeCanvas();

    class Particle {
        constructor() {
            this.x = Math.random() * canvasWidth;
            this.y = Math.random() * canvasHeight;
            this.size = Math.random() * 1.5 + 0.5;
            this.speedX = (Math.random() - 0.5) * 0.4;
            this.speedY = (Math.random() - 0.5) * 0.4;
            this.opacity = Math.random() * 0.5 + 0.2;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            if (this.x < 0 || this.x > canvasWidth) this.speedX *= -1;
            if (this.y < 0 || this.y > canvasHeight) this.speedY *= -1;
        }
        draw() {
            ctx.fillStyle = `rgba(249, 115, 22, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function initParticles() {
        particlesArray = [];
        const numberOfParticles = Math.min(Math.floor((canvasWidth * canvasHeight) / 12000), 70);
        for (let i = 0; i < numberOfParticles; i++) {
            particlesArray.push(new Particle());
        }
    }
    initParticles();

    function animateParticles() {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
            particlesArray[i].draw();

            for (let j = i + 1; j < particlesArray.length; j++) {
                const dx = particlesArray[i].x - particlesArray[j].x;
                const dy = particlesArray[i].y - particlesArray[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 120) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(249, 115, 22, ${0.15 - distance / 1200})`;
                    ctx.lineWidth = 0.6;
                    ctx.moveTo(particlesArray[i].x, particlesArray[i].y);
                    ctx.lineTo(particlesArray[j].x, particlesArray[j].y);
                    ctx.stroke();
                    ctx.closePath();
                }
            }
        }
        requestAnimationFrame(animateParticles);
    }
    animateParticles();
}


/* =================================================================
   3. TERMINAL INTERACTIF & GITHUB COMMITS (Spécifique index.html / accueil.html)
   ================================================================ */
const logsContainer = document.getElementById('dynamic-logs');
const terminalBody = document.getElementById('terminal-body');
const commitCounter = document.getElementById('commit-counter');

// Logs personnalisés selon la page détectée (index.html ou accueil.html)
const isAccueilPage = window.location.pathname.includes('accueil.html');

const customDevLogs = isAccueilPage ? [
    { tag: "[INIT]", color: "text-amber-400", text: "Chargement du profil d'Arthur Guillemin...", fullColor: true },
    { tag: "[STACK]", color: "text-green-400", text: "JavaScript, HTML5/CSS3, Tailwind, Apps Script" },
    { tag: "[SLAM]", color: "text-blue-400", text: "Spécialité Solutions Logicielles & BDD SQL" },
    { tag: "[STATUS]", color: "text-orange-400", text: "Disponible pour projets & opportunités" }
] : [
    { tag: "[INIT]", color: "text-amber-400", text: "Initialisation de l'architecture V2.0...", fullColor: true },
    { tag: "[FEATURE]", color: "text-green-400", text: "Ajout du compteur de progression dynamique" },
    { tag: "[FEATURE]", color: "text-green-400", text: "Ajout du système de cache local pour les commits GitHub" },
    { tag: "[FEATURE]", color: "text-green-400", text: "Ajout du module de Live Logs terminal" },
    { tag: "[UI/UX]", color: "text-blue-400", text: "Création du layout responsive avec Tailwind CSS" }
];

let displayedCommitShas = new Set();
let logQueue = [];
let isTyping = false;

async function fetchGitHubCommitsAndRender() {
    if (!logsContainer) return; // Si la page n'a pas de terminal, on arrête

    const CACHE_KEY = 'github_commits_cache';
    const CACHE_TIME_KEY = 'github_commits_time';
    const CACHE_DURATION = 15 * 60 * 1000;

    let allCommits = [];
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
    const now = new Date().getTime();

    // Si on est sur l'index, on va chercher les vrais commits GitHub en plus
    if (!isAccueilPage) {
        if (cachedData && cachedTime && (now - cachedTime < CACHE_DURATION)) {
            allCommits = JSON.parse(cachedData);
        } else {
            try {
                const [resMain, resDev] = await Promise.all([
                    fetch('https://api.github.com/repos/1969A/1969A.github.io/commits?sha=main&per_page=15'),
                    fetch('https://api.github.com/repos/1969A/1969A.github.io/commits?sha=dev&per_page=15')
                ]);

                const commitsMain = resMain.ok ? await resMain.json() : [];
                const commitsDev = resDev.ok ? await resDev.json() : [];

                const commitsMap = new Map();
                if (Array.isArray(commitsDev)) {
                    commitsDev.forEach(commit => commitsMap.set(commit.sha, { data: commit, branch: 'dev' }));
                }
                if (Array.isArray(commitsMain)) {
                    commitsMain.forEach(commit => commitsMap.set(commit.sha, { data: commit, branch: 'main' }));
                }

                allCommits = Array.from(commitsMap.values()).sort((a, b) => {
                    const dateA = new Date(a.data.commit.author ? a.data.commit.author.date : a.data.commit.committer.date);
                    const dateB = new Date(b.data.commit.author ? b.data.commit.author.date : b.data.commit.committer.date);
                    return dateA - dateB;
                });

                if (allCommits.length > 0) {
                    localStorage.setItem(CACHE_KEY, JSON.stringify(allCommits));
                    localStorage.setItem(CACHE_TIME_KEY, now);
                }
            } catch (error) {
                console.error("Erreur API :", error);
                if (cachedData) allCommits = JSON.parse(cachedData);
            }
        }
    }

    logsContainer.innerHTML = '';
    displayedCommitShas.clear();
    logQueue = [];

    customDevLogs.forEach(log => {
        logQueue.push({ type: 'custom', data: log });
    });

    if (allCommits.length > 0) {
        allCommits.forEach(item => {
            logQueue.push({ type: 'commit', data: item.data, branch: item.branch });
            displayedCommitShas.add(item.data.sha);
        });
    }

    let totalActions = customDevLogs.length + displayedCommitShas.size;
    if (commitCounter) {
        commitCounter.textContent = `(${totalActions} actions${allCommits.length > 0 ? ' & commits' : ''})`;
    }

    if (!isTyping) {
        processLogQueue();
    }
}

async function processLogQueue() {
    if (logQueue.length === 0) {
        isTyping = false;
        return;
    }

    isTyping = true;
    const item = logQueue.shift();

    if (item.type === 'custom') {
        await typeCustomLog(item.data);
    } else if (item.type === 'commit') {
        await typeCommitLog(item.data, item.branch);
    }

    await new Promise(resolve => setTimeout(resolve, 120));
    processLogQueue();
}

function typeCustomLog(log) {
    return new Promise(resolve => {
        const div = document.createElement('div');
        div.className = "flex items-center space-x-2 py-0.5 font-mono text-xs";
        
        const tagSpan = document.createElement('span');
        tagSpan.className = `${log.color} shrink-0 font-bold`;
        tagSpan.textContent = log.tag + ' ';
        div.appendChild(tagSpan);

        const textSpan = document.createElement('span');
        textSpan.className = log.fullColor ? log.color : "text-gray-300";
        div.appendChild(textSpan);

        const cursor = document.createElement('span');
        cursor.className = "inline-block w-2 h-3.5 bg-orange-400 ml-1 animate-pulse align-middle";
        div.appendChild(cursor);

        logsContainer.appendChild(div);

        let index = 0;
        function typeChar() {
            if (index < log.text.length) {
                textSpan.textContent += log.text.charAt(index);
                index++;
                if (terminalBody) terminalBody.scrollTop = terminalBody.scrollHeight;
                setTimeout(typeChar, 10);
            } else {
                cursor.remove();
                resolve();
            }
        }
        typeChar();
    });
}

function typeCommitLog(commit, branch = 'dev') {
    return new Promise(resolve => {
        const sha = commit.sha.substring(0, 7);
        const message = commit.commit.message.split('\n')[0];
        const author = commit.commit.author ? commit.commit.author.name : 'Auteur';
        
        const rawDate = commit.commit.author ? commit.commit.author.date : commit.commit.committer.date;
        const dateObj = new Date(rawDate);
        const formattedDate = dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        const formattedTime = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const dateTimeStr = `${formattedDate} ${formattedTime}`;

        const branchColorClass = branch === 'main' ? 'text-green-400 border-green-500/30' : 'text-amber-400 border-amber-500/30';

        const div = document.createElement('div');
        div.className = "flex items-center space-x-2 py-0.5 font-mono text-xs";
        
        div.innerHTML = `
            <span class="${branchColorClass} shrink-0 text-[10px] px-1 rounded bg-neutral-900 border">[${branch}]</span>
            <span class="text-rose-400 shrink-0">[${sha}]</span>
            <span class="text-gray-500 shrink-0 text-[11px]">${dateTimeStr}</span>
        `;

        const msgSpan = document.createElement('span');
        msgSpan.className = "text-gray-300 truncate";
        msgSpan.title = message;
        div.appendChild(msgSpan);

        const cursor = document.createElement('span');
        cursor.className = "inline-block w-2 h-3.5 bg-orange-400 ml-1 animate-pulse align-middle shrink-0";
        div.appendChild(cursor);

        const authorSpan = document.createElement('span');
        authorSpan.className = "text-orange-400/80 text-[10px] shrink-0 ml-auto";
        authorSpan.textContent = `(${author})`;

        logsContainer.appendChild(div);

        let index = 0;
        function typeChar() {
            if (index < message.length) {
                msgSpan.textContent += message.charAt(index);
                index++;
                if (terminalBody) terminalBody.scrollTop = terminalBody.scrollHeight;
                setTimeout(typeChar, 12);
            } else {
                cursor.remove();
                div.appendChild(authorSpan);
                resolve();
            }
        }
        typeChar();
    });
}

// Lancement du terminal si l'élément existe
if (logsContainer) {
    fetchGitHubCommitsAndRender();
    if (!isAccueilPage) {
        setInterval(fetchGitHubCommitsAndRender, 15 * 60 * 1000);
    }
}

function clearTerminal() {
    localStorage.removeItem('github_commits_cache');
    localStorage.removeItem('github_commits_time');
    fetchGitHubCommitsAndRender();
    showToast('Terminal actualisé avec succès !', 'info');
}


/* =================================================================
   4. FILTRAGE DES PROJETS (Spécifique accueil.html)
   ================================================================ */
window.filterProjects = function(category) {
    const cards = document.querySelectorAll('.project-card');
    const buttons = document.querySelectorAll('.filter-btn');

    if (cards.length === 0) return;

    buttons.forEach(btn => {
        btn.classList.remove('bg-orange-500', 'text-white');
        btn.classList.add('glass-card', 'text-gray-400');
    });

    event.currentTarget.classList.remove('glass-card', 'text-gray-400');
    event.currentTarget.classList.add('bg-orange-500', 'text-white');

    cards.forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
};


/* =================================================================
   5. GESTION DES FORMULAIRES (Formspree) & TOASTS NOTIFICATIONS
   ================================================================ */
window.handleSubscribe = async function(e) {
    e.preventDefault();
    const form = e.target;
    const emailInput = form.querySelector('input[name="email"]');
    const submitBtn = form.querySelector('#submit-btn');

    if (!submitBtn) return;

    const originalBtnHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-80', 'cursor-not-allowed');
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> <span>Traitement...</span>';

    try {
        const formData = new FormData(form);
        const response = await fetch(form.action, {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
            showToast('Action effectuée avec succès !', 'success');
            form.reset();
            submitBtn.innerHTML = '<span>Succès !</span><i class="fa-solid fa-check text-xs"></i>';
        } else {
            const data = await response.json();
            const errorMsg = data.errors ? data.errors.map(err => err.message).join(", ") : 'Une erreur est survenue.';
            showToast(errorMsg, 'info');
            submitBtn.innerHTML = originalBtnHTML;
        }
    } catch (error) {
        showToast('Erreur de réseau. Vérifiez votre connexion.', 'info');
        submitBtn.innerHTML = originalBtnHTML;
    } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-80', 'cursor-not-allowed');

        setTimeout(() => {
            submitBtn.innerHTML = originalBtnHTML;
        }, 3000);
    }
};

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl glass-card border text-sm transition-all duration-300 transform translate-y-4 opacity-0`;

    let iconHtml = '<i class="fa-solid fa-circle-check text-amber-400 text-lg"></i>';
    let borderColor = 'border-amber-500/30';

    if (type === 'info') {
        iconHtml = '<i class="fa-solid fa-circle-info text-orange-400 text-lg"></i>';
        borderColor = 'border-orange-500/30';
    }

    toast.classList.add(borderColor);
    toast.innerHTML = `
        ${iconHtml}
        <span class="text-gray-200 font-medium text-xs">${message}</span>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-4', 'opacity-0');
    });

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => { toast.remove(); }, 300);
    }, 4000);
}