// ==UserScript==
// @name         ITD STATS
// @namespace    http://tampermonkey.net/
// @homepageURL  https://github.com/Dima-programmer
// @downloadURL  https://github.com/Dima-programmer/ITD-STATS-AI/raw/refs/heads/main/main.user.js
// @updateURL    https://github.com/Dima-programmer/ITD-STATS-AI/raw/refs/heads/main/main.user.js
// @version      12.1
// @description  AI‑Enhanced Analytics for ITD — полная статистика, умные топы, ИИ‑советы
// @author       skorlange, dmitrii_gr
// @match        https://xn--d1ah4a.com/*
// @match        https://итд.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    console.log("[ITD STATS 12.0] Запущен — AI‑Enhanced версия");

    // ========== ФРАЗЫ И КОНСТАНТЫ ==========
    const potatoPhrases = [
        "🥔 копаем картошку...",
        "🍟 жарим картошку фри...",
        "🥔 картошка всему голова...",
        "🥔 спасибо, что выбрали нас!",
        "🥔 чистим картошечку...",
        "🍠 запекаем батат...",
        "🥔 месим пюрешку...",
        "🥔 варим картошечку в мундире...",
        "🥔 собираем урожай...",
        "🍟 солим картошечку...",
        "🥔 добавляем укропчик...",
        "🥔 картофель фри с сыром...",
        "🥔 драники на завтрак...",
        "🥔 зразы с грибами...",
        "🥔 картошка по-деревенски...",
        "💨 дым коромыслом...",
        "🔥 смокинг на дымке...",
        "🌫️ густой дым аналитики...",
        "💨 курим бамбук над статистикой...",
        "🔥 дымный перекур...",
        "🌪️ вихрь данных в дыму...",
        "💨 запах жареной картошки с дымком...",
        "🔥 бахнем дыма для ясности...",
        "🌫️ дымовая завеса статистики..."
    ];

    const potatoAIPhrases = {
        analyzing: "💨 Разгоняем дым над данными...",
        generating: "🔥 Дымим ИИ-топы...",
        loading: "🌫️ Ловим дым популярных постов...",
        recommendation: "💨 Узнайте, как сделать ваш контент дымным...",
        button: "🔥 Задымить аналитику",
        retry: (attempt, delay) => `💨 Ой, дым рассеялся! Повторная попытка ${attempt}/5 через ${delay/1000} сек...`,
        success: "🔥 Дымок готов! Анализ завершён.",
        error: "💨 Дым улетел. Попробуйте позже."
    };

    function getRandomPotatoPhrase() {
        return potatoPhrases[Math.floor(Math.random() * potatoPhrases.length)];
    }

    const calcER = (s) => s.views > 0
        ? ((s.likes + s.comments + s.reposts) / s.views * 100).toFixed(2)
        : '0.00';

    // ========== НАСТРОЙКИ ==========
    let settings = {
        style: 'potato',
        theme: 'auto',
        ai: {
            apiKey: "",
            baseUrl: "https://openrouter.ai/api/v1/chat/completions",
            model: "openrouter/free"
        }
    };

    function loadSettings() {
        const saved = localStorage.getItem('itd_stats_settings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                settings = { ...settings, ...parsed };
                if (parsed.ai) settings.ai = { ...settings.ai, ...parsed.ai };
            } catch(e) {}
        }
    }

    function saveSettings() {
        localStorage.setItem('itd_stats_settings', JSON.stringify(settings));
    }

    function hasApiKey() {
        return settings.ai.apiKey && settings.ai.apiKey.trim() !== '';
    }

    function showToast(message, type = 'info', duration = 4000) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'error' ? '#f44336' : 'var(--primary, #ffb347)'};
            color: ${type === 'error' ? '#fff' : 'var(--bg-dark, #1a1a24)'};
            padding: 12px 24px;
            border-radius: 40px;
            z-index: 10002;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            backdrop-filter: blur(8px);
            transition: opacity 0.3s;
            opacity: 0;
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.style.opacity = '1', 10);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    function applyThemeAndStyle(modal, settingsData) {
        if (!modal) return;
        modal.classList.remove('theme-auto', 'theme-light', 'theme-dark', 'style-potato', 'style-smoke');
        modal.classList.add(`theme-${settingsData.theme}`);
        modal.classList.add(`style-${settingsData.style}`);
        if (settingsData.theme === 'auto') {
            const htmlTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            modal.classList.add(`theme-${htmlTheme}`);
        }
        let rootVars = '';
        if (settingsData.style === 'potato') {
            rootVars = `
                --primary: #ffb347;
                --primary-hover: #ff8c42;
                --primary-glow: rgba(255,180,71,0.3);
                --bg-dark: #1a1a24;
                --bg-darker: #0f0f1a;
                --card-bg: rgba(42,42,42,0.7);
                --border: rgba(255,180,71,0.2);
                --text: #f0f0f0;
                --text-secondary: #aaa;
                --input-bg: #2a2a2a;
                --hover-bg: #333;
            `;
        } else {
            // Контрастная дымная палитра: ч/б, серый, лёгкий синий
            rootVars = `
                --primary: #7f9aa0;
                --primary-hover: #95b4bb;
                --primary-glow: rgba(127,154,160,0.3);
                --bg-dark: #2a2a2a;
                --bg-darker: #1c1c1c;
                --card-bg: rgba(36,36,36,0.9);
                --border: rgba(100,120,130,0.5);
                --text: #ececec;
                --text-secondary: #bcbcbc;
                --input-bg: #3a3a3a;
                --hover-bg: #4a4a4a;
            `;
        }
        const styleEl = document.getElementById('itd-stats-dynamic-style') || (() => {
            const s = document.createElement('style');
            s.id = 'itd-stats-dynamic-style';
            document.head.appendChild(s);
            return s;
        })();
        styleEl.textContent = `
            .${modal.classList[0]} {
                ${rootVars}
            }
            .style-smoke.theme-light {
                --primary: #5f7f81;
                --primary-hover: #7a9c9e;
                --bg-dark: #f0f0f0;
                --bg-darker: #e2e2e2;
                --card-bg: rgba(255,255,255,0.9);
                --border: rgba(0,0,0,0.15);
                --text: #222;
                --text-secondary: #555;
                --input-bg: #fff;
                --hover-bg: #e0e0e0;
            }
            .style-smoke.theme-dark {
                --primary: #7f9aa0;
                --primary-hover: #95b4bb;
                --bg-dark: #2a2a2a;
                --bg-darker: #1c1c1c;
                --card-bg: rgba(36,36,36,0.9);
                --border: rgba(100,120,130,0.5);
                --text: #ececec;
                --text-secondary: #bcbcbc;
                --input-bg: #3a3a3a;
                --hover-bg: #4a4a4a;
            }
            .theme-light {
                --bg-dark: #f8f9fa;
                --bg-darker: #e9ecef;
                --card-bg: rgba(255,255,255,0.9);
                --border: rgba(0,0,0,0.1);
                --text: #212529;
                --text-secondary: #6c757d;
                --input-bg: #fff;
                --hover-bg: #dee2e6;
            }
            .theme-dark {
                --bg-dark: #1a1a24;
                --bg-darker: #0f0f1a;
                --card-bg: rgba(42,42,42,0.7);
                --border: rgba(255,180,71,0.2);
                --text: #f0f0f0;
                --text-secondary: #aaa;
                --input-bg: #2a2a2a;
                --hover-bg: #333;
            }
        `;
    }

    // ========== MARKDOWN ПАРСЕР ==========
    function markdownToHtml(text) {
        if (!text) return '';
        let html = text;
        html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
        html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/^\s*-\s+(.*)$/gm, '<li>$1</li>');
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color:var(--primary); text-decoration:underline;">$1</a>');
        html = html.replace(/`([^`]+)`/g, '<code style="background:var(--input-bg); padding:2px 6px; border-radius:4px; color:var(--primary);">$1</code>');
        html = html.replace(/^> (.*$)/gm, '<blockquote style="border-left:3px solid var(--primary); padding-left:12px; margin:8px 0; color:var(--text-secondary);">$1</blockquote>');
        // Таблицы
const tableRegex = /(\|.*\|[\r\n]+\|[-:\s|]+\|[\r\n]+(\|.*\|[\r\n]+)+)/g;
html = html.replace(tableRegex, (match) => {
    const lines = match.trim().split(/\r?\n/);
    if (lines.length < 2) return match;
    const headerLine = lines[0];
    const separatorLine = lines[1];
    const dataLines = lines.slice(2);
    const headers = headerLine.split('|').filter(cell => cell.trim() !== '').map(cell => cell.trim());
    const aligns = separatorLine.split('|').filter(cell => cell.trim() !== '').map(cell => {
        const align = cell.trim();
        if (align.startsWith(':') && align.endsWith(':')) return 'center';
        if (align.endsWith(':')) return 'right';
        if (align.startsWith(':')) return 'left';
        return 'left';
    });
    let tableHtml = '<table style="width:100%; border-collapse:collapse; margin:16px 0; background:var(--card-bg); border-radius:8px; overflow:hidden;">';
    tableHtml += '<thead>';
    tableHtml += '<tr>';
    headers.forEach((h, idx) => {
        const align = aligns[idx] || 'left';
        tableHtml += `<th style="padding:10px 12px; text-align:${align}; border-bottom:2px solid var(--primary); color:var(--primary);">${h}</th>`;
    });
    tableHtml += '</tr>';
    tableHtml += '</thead><tbody>';
    dataLines.forEach(line => {
        if (line.trim() === '') return;
        const cells = line.split('|').filter(cell => cell.trim() !== '').map(cell => cell.trim());
        tableHtml += '<tr>';
        cells.forEach((cell, idx) => {
            const align = aligns[idx] || 'left';
            tableHtml += `<td style="padding:8px 12px; text-align:${align}; border-bottom:1px solid var(--border);">${cell}</td>`;
        });
        tableHtml += '</tr>';
    });
    tableHtml += '</tbody></table>';
    return tableHtml;
});
        html = html.replace(/<li>(.*?)<\/li>(?=\s*<li>)/g, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/s, '<ul style="margin:8px 0; padding-left:20px;">$1</ul>');
        html = html.replace(/\n/g, '<br>');
        html = html.replace(/<li>(.*?)<br>/g, '<li>$1');
        return html;
    }

    function createSpinner(size = 40, color = 'var(--primary)') {
        return `<div style="display:inline-block; width:${size}px; height:${size}px; border:3px solid rgba(0,0,0,0.2); border-top-color:${color}; border-radius:50%; animation: spin 1s linear infinite;"></div>`;
    }

    function createThinkingDots() {
        return `<div style="display:inline-flex; gap:6px; align-items:center;">
            <div style="width:8px; height:8px; background:var(--primary); border-radius:50%; animation: bounce 0.8s infinite ease-in-out;"></div>
            <div style="width:8px; height:8px; background:var(--primary); border-radius:50%; animation: bounce 0.8s infinite ease-in-out 0.2s;"></div>
            <div style="width:8px; height:8px; background:var(--primary); border-radius:50%; animation: bounce 0.8s infinite ease-in-out 0.4s;"></div>
        </div>`;
    }

    if (!document.getElementById('itd-animations')) {
        const animStyle = document.createElement('style');
        animStyle.id = 'itd-animations';
        animStyle.textContent = `
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            @keyframes bounce {
                0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
                30% { transform: translateY(-8px); opacity: 1; }
            }
        `;
        document.head.appendChild(animStyle);
    }

    // ========== ОСНОВНЫЕ ФУНКЦИИ ==========
    function getProfileInfo() {
        const displayNameElem = document.querySelector('span.lE9vN8i6') ||
                               document.querySelector('span.j8vGlZKp');
        const displayName = displayNameElem ? displayNameElem.textContent.trim() : '';

        const usernameElem = document.querySelector('span.Xnp1EFrD');
        const usernameRaw = usernameElem ? usernameElem.textContent.trim() : '';
        const username = usernameRaw ? usernameRaw.replace('@', '') : getUsername();

        const avatarImg = document.querySelector('div.GKtAeZvh img');
        const smileyElem = document.querySelector('span.pl3SNO9Y');

        let avatarContent = '';
        if (avatarImg && avatarImg.src) {
            avatarContent = `<img src="${avatarImg.src}" alt="Аватар" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:2px solid var(--primary);box-shadow:0 0 12px var(--primary-glow);">`;
        } else if (smileyElem && smileyElem.textContent.trim()) {
            const smiley = smileyElem.textContent.trim();
            avatarContent = `<div style="width:64px;height:64px;border-radius:50%;background:var(--bg-darker);display:flex;align-items:center;justify-content:center;font-size:40px;border:2px solid var(--primary);color:var(--primary);box-shadow:0 0 12px var(--primary-glow);">${smiley}</div>`;
        } else {
            avatarContent = `<div style="width:64px;height:64px;border-radius:50%;background:var(--bg-darker);display:flex;align-items:center;justify-content:center;font-size:32px;border:2px solid var(--primary);color:#aaa;">?</div>`;
        }

        const followersElems = document.querySelectorAll('span.LIXEFTYA');
        const followers = followersElems[0] ? followersElems[0].textContent.trim() : '?';
        const following = followersElems[1] ? followersElems[1].textContent.trim() : '?';

        let regDate = 'Регистрация: неизвестно';
        const regElems = document.querySelectorAll('span.at4eWYfl');
        for (const el of regElems) {
            const text = el.textContent.trim();
            if (text.includes('Регистрация:')) {
                regDate = text;
                break;
            }
        }

        return { username, displayName, avatarContent, followers, following, regDate };
    }

    function getUsername() {
        const path = window.location.pathname.split('/').filter(Boolean);
        if (path.length < 1) return null;
        let candidate = path[0];
        if (candidate.startsWith('@')) candidate = candidate.slice(1);
        if (/^[a-zA-Z0-9_.-]+$/.test(candidate)) return candidate;
        return null;
    }

    async function refreshToken() {
        try {
            const res = await fetch("/api/v1/auth/refresh", { method: "POST" });
            if (!res.ok) return null;
            const json = await res.json();
            return json.accessToken || json.token || null;
        } catch {
            return null;
        }
    }

    async function fetchPosts(username) {
        let token = await refreshToken();
        if (!token) return [];

        const limit = 50;
        let posts = [];
        let cursor = null;
        let consecutiveEmpty = 0;
        const MAX_EMPTY = 5;

        while (consecutiveEmpty < MAX_EMPTY) {
            try {
                let url = `/api/posts/user/${username}?limit=${limit}&sort=new`;
                if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;

                const res = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.status === 401) {
                    token = await refreshToken();
                    if (!token) break;
                    continue;
                }

                if (!res.ok) break;

                const json = await res.json();
                const newPosts = json?.data?.posts || [];

                if (newPosts.length > 0) {
                    posts.push(...newPosts);
                    cursor = newPosts[newPosts.length - 1]?.createdAt || null;
                    consecutiveEmpty = 0;
                } else {
                    consecutiveEmpty++;
                }

                if (newPosts.length < limit) break;

            } catch (err) {
                console.warn("[ITD STATS] Ошибка загрузки постов:", err);
                consecutiveEmpty++;
                await new Promise(r => setTimeout(r, 800));
            }
        }

        console.log(`[ITD STATS] Загружено постов для @${username}: ${posts.length}`);
        return posts;
    }

    function calculateSplitStats(posts, profileUsername) {
        const authorPosts = [];
        const guestPosts = [];

        const lowerProfileName = profileUsername.toLowerCase();

        posts.forEach(p => {
            const author = p.author || p.user || p.creator || {};
            const authorName = (author.username || author.nick || author.name || '').toLowerCase();

            if (authorName === lowerProfileName || author.id === profileUsername) {
                authorPosts.push(p);
            } else {
                guestPosts.push(p);
            }
        });

        const statsAuthor = calcOneGroup(authorPosts);
        const statsGuest  = calcOneGroup(guestPosts);
        const statsTotal  = calcOneGroup(posts);

        const guestPercent = statsTotal.posts > 0
            ? Math.round((guestPosts.length / statsTotal.posts) * 100)
            : 0;

        const erAuthor = calcER(statsAuthor);
        const erGuest = calcER(statsGuest);
        const erTotal = calcER(statsTotal);

        return {
            statsAuthor,
            statsGuest,
            statsTotal,
            guestPercent,
            erAuthor,
            erGuest,
            erTotal
        };
    }

    function calcOneGroup(posts) {
        if (!posts.length) return { posts: 0, likes: 0, comments: 0, reposts: 0, views: 0,
            avgLikes: 0, avgComments: 0, avgReposts: 0, avgViews: 0,
            maxLikes: 0, maxComments: 0, maxReposts: 0, maxViews: 0 };

        let tL = 0, tC = 0, tR = 0, tV = 0;
        let mL = 0, mC = 0, mR = 0, mV = 0;

        posts.forEach(p => {
            const l = Number(p.likesCount || 0);
            const c = Number(p.commentsCount || 0);
            const r = Number(p.repostsCount || 0);
            const v = Number(p.viewsCount || 0);

            tL += l; tC += c; tR += r; tV += v;

            if (l > mL) mL = l;
            if (c > mC) mC = c;
            if (r > mR) mR = r;
            if (v > mV) mV = v;
        });

        const n = posts.length;

        return {
            posts: n,
            likes: tL, comments: tC, reposts: tR, views: tV,
            avgLikes: n ? Math.round(tL / n) : 0,
            avgComments: n ? Math.round(tC / n) : 0,
            avgReposts: n ? Math.round(tR / n) : 0,
            avgViews: n ? Math.round(tV / n) : 0,
            maxLikes: mL, maxComments: mC, maxReposts: mR, maxViews: mV
        };
    }

    function calculateSmartScores(posts, profileUsername) {
        const now = new Date();
        const maxViews = Math.max(...posts.map(p => p.viewsCount || 0), 1);
        const avgViews = posts.reduce((s,p) => s + (p.viewsCount || 0), 0) / (posts.length || 1);

        const scores = posts.map(p => {
            const views = p.viewsCount || 0;
            const likes = p.likesCount || 0;
            const comments = p.commentsCount || 0;
            const reposts = p.repostsCount || 0;
            const engagement = likes + comments + reposts;
            const er = views > 0 ? (engagement / views) * 100 : 0;

            const createdAt = new Date(p.createdAt || p.created_at || 0);
            const ageDays = Math.max(0, (now - createdAt) / (1000 * 60 * 60 * 24));

            let hasPhoto = false, hasVideo = false, hasPoll = false;
            if (p.media && p.media.length) {
                hasPhoto = p.media.some(m => m.type === 'image');
                hasVideo = p.media.some(m => m.type === 'video');
            }
            if (p.poll) hasPoll = true;

            const textLength = (p.content || p.text || '').length;

            let trendingScore = 0;
            if (ageDays < 7) {
                const recencyFactor = 1 / (ageDays + 0.5);
                const viewRatio = views / maxViews;
                trendingScore = er * recencyFactor * (viewRatio + 0.1) * 100;
            }

            const interactionsWeighted = likes + 2*comments + 5*reposts + 0.1*views;
            const mediaBonus = 1 + (hasPhoto ? 0.5 : 0) + (hasVideo ? 0.8 : 0);
            const pollBonus = hasPoll ? 0.3 : 0;
            const textBonus = textLength > 100 ? 0.2 : 0;
            const coolnessScore = interactionsWeighted * (er + 0.1) * mediaBonus * (1 + pollBonus) * (1 + textBonus);

            let underratedScore = 0;
            if (views < avgViews) {
                underratedScore = er * (1 - views / maxViews);
            }

            let overratedScore = 0;
            if (views > avgViews && er < 5) {
                overratedScore = (views / maxViews) * (1 - er / 100);
            }

            let controversialScore = 0;
            if (likes > 0) {
                const commentToLikeRatio = comments / likes;
                controversialScore = commentToLikeRatio * (1 + er/100);
            }

            let evergreenScore = 0;
            if (ageDays > 30 && views > 0) {
                evergreenScore = (views * (er + 0.01)) / (ageDays + 1);
            }

            let hiddenGemScore = 0;
            if (views < avgViews && er > 10) {
                hiddenGemScore = er * (1 - views / avgViews);
            }

            const author = p.author || p.user || p.creator || {};
            const authorName = (author.username || author.nick || author.name || '').toLowerCase();
            const isAuthor = authorName === profileUsername.toLowerCase() || author.id === profileUsername;

            return {
                ...p,
                er,
                ageDays,
                trendingScore,
                coolnessScore,
                underratedScore,
                overratedScore,
                controversialScore,
                evergreenScore,
                hiddenGemScore,
                isAuthor,
                authorUsername: (author.username || author.nick || author.name || '').replace(/^@/, ''),
                postId: p.id || p.postId || p._id,
                createdAt,
                dateStr: createdAt.toLocaleDateString('ru-RU'),
                textShort: (p.content || p.text || 'Без текста').slice(0, 80) + ((p.content || p.text || '').length > 80 ? '...' : '')
            };
        });

        return scores;
    }

    function prepareSmartTopLists(scores) {
        const makeTop = (scoreKey, limit = 100) => {
            const sorted = [...scores].sort((a,b) => b[scoreKey] - a[scoreKey]).slice(0, limit);
            return sorted.map((p, i) => ({
                url: p.postId ? `https://xn--d1ah4a.com/@${p.authorUsername}/post/${p.postId}` : '#',
                text: p.textShort,
                value: p[scoreKey],
                date: p.dateStr,
                isAuthor: p.isAuthor,
                er: p.er,
                views: p.viewsCount || 0,
                likes: p.likesCount || 0,
                comments: p.commentsCount || 0,
                reposts: p.repostsCount || 0
            }));
        };

        return {
            trending: makeTop('trendingScore'),
            cool: makeTop('coolnessScore'),
            underrated: makeTop('underratedScore'),
            overrated: makeTop('overratedScore'),
            controversial: makeTop('controversialScore'),
            evergreen: makeTop('evergreenScore'),
            hiddenGem: makeTop('hiddenGemScore')
        };
    }

    function prepareTopLists(posts, profileUsername) {
        const lowerProfileName = profileUsername.toLowerCase();

        const isAuthorPost = (p) => {
            const author = p.author || p.user || p.creator || {};
            const authorName = (author.username || author.nick || author.name || '').toLowerCase();
            const authorId = author.id || author.userId || author._id || '';
            return authorName === lowerProfileName || authorId === profileUsername;
        };

        const makeTop = (sortKey, limit = 100) => [...posts]
            .sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0))
            .slice(0, limit)
            .map(p => {
                const author = p.author || p.user || p.creator || {};
                const authorUsername = (author.username || author.nick || author.name || profileUsername).replace(/^@/, '');
                const postId = p.id || p.postId || p._id || null;
                const url = postId ? `https://xn--d1ah4a.com/@${authorUsername}/post/${postId}` : null;
                return {
                    url,
                    text: (p.content || p.text || 'Без текста').slice(0, 80) + ((p.content || p.text || '').length > 80 ? '...' : ''),
                    value: p[sortKey] || 0,
                    date: new Date(p.createdAt || p.created_at || 0).toLocaleDateString('ru-RU'),
                    isAuthor: isAuthorPost(p)
                };
            });

        const topViews = makeTop('viewsCount');
        const topLikes = makeTop('likesCount');
        const topComments = makeTop('commentsCount');
        const topReposts = makeTop('repostsCount');

        const topER = [...posts]
            .map(p => {
                const views = Number(p.viewsCount || 0);
                const engagement = (Number(p.likesCount || 0) + Number(p.commentsCount || 0) + Number(p.repostsCount || 0));
                const er = views > 0 ? (engagement / views * 100) : 0;
                const author = p.author || p.user || p.creator || {};
                const authorUsername = (author.username || author.nick || author.name || profileUsername).replace(/^@/, '');
                const postId = p.id || p.postId || p._id || null;
                const url = postId ? `https://xn--d1ah4a.com/@${authorUsername}/post/${postId}` : null;
                return {
                    url,
                    text: (p.content || p.text || 'Без текста').slice(0, 80) + ((p.content || p.text || '').length > 80 ? '...' : ''),
                    er: er.toFixed(2),
                    value: er,
                    views: views.toLocaleString(),
                    date: new Date(p.createdAt || p.created_at || 0).toLocaleDateString('ru-RU'),
                    isAuthor: isAuthorPost(p)
                };
            })
            .filter(p => p.er > 0)
            .sort((a, b) => b.er - a.er)
            .slice(0, 100);

        const guestActivity = {};
        posts.forEach(p => {
            const author = p.author || p.user || p.creator || {};
            const name = (author.username || author.nick || author.name || 'Аноним').replace(/^@/, '').toLowerCase();
            const userId = author.username || author.nick || author.name || null;
            if (name === lowerProfileName || userId === profileUsername) return;
            if (!guestActivity[name]) guestActivity[name] = { count: 0, likes: 0, comments: 0, userId };
            guestActivity[name].count++;
            guestActivity[name].likes += Number(p.likesCount || 0);
            guestActivity[name].comments += Number(p.commentsCount || 0);
        });

        const topGuests = Object.entries(guestActivity)
            .sort((a, b) => b[1].count - a[1].count || b[1].likes - a[1].likes)
            .slice(0, 100)
            .map(([name, data]) => ({
                name,
                url: data.userId ? `https://xn--d1ah4a.com/@${data.userId.replace(/^@/, '')}` : null,
                count: data.count,
                likes: data.likes,
                comments: data.comments
            }));

        return {
            topViews,
            topLikes,
            topComments,
            topReposts,
            topER,
            topGuests
        };
    }

    function prepareHistoryList(posts, profileUsername) {
        const lowerProfileName = profileUsername.toLowerCase();

        const isAuthorPost = (p) => {
            const author = p.author || p.user || p.creator || {};
            const authorName = (author.username || author.nick || author.name || '').toLowerCase();
            const authorId = author.id || author.userId || author._id || '';
            return authorName === lowerProfileName || authorId === profileUsername;
        };

        const sortedPosts = [...posts].sort((a, b) =>
            new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0)
        );

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const monthAgo = new Date(today);
        monthAgo.setDate(monthAgo.getDate() - 30);
        const threeMonthsAgo = new Date(today);
        threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);

        return sortedPosts.map(p => {
            const author = p.author || p.user || p.creator || {};
            const authorUsername = (author.username || author.nick || author.name || profileUsername).replace(/^@/, '');
            const postId = p.id || p.postId || p._id || null;
            const url = postId ? `https://xn--d1ah4a.com/@${authorUsername}/post/${postId}` : null;
            const postDate = new Date(p.createdAt || p.created_at || 0);
            const postDateOnly = new Date(postDate.getFullYear(), postDate.getMonth(), postDate.getDate());
            const diffTime = today - postDateOnly;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            let category = 'older';
            if (postDateOnly.getTime() === today.getTime()) {
                category = 'today';
            } else if (postDateOnly.getTime() === yesterday.getTime()) {
                category = 'yesterday';
            } else if (postDateOnly >= weekAgo) {
                category = 'week';
            } else if (postDateOnly >= monthAgo) {
                category = 'month';
            } else if (postDateOnly >= threeMonthsAgo) {
                category = 'threeMonths';
            }

            return {
                url,
                text: (p.content || p.text || 'Без текста'),
                date: postDate,
                dateText: postDate.toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                daysAgo: diffDays,
                category: category,
                likes: p.likesCount || 0,
                comments: p.commentsCount || 0,
                reposts: p.repostsCount || 0,
                views: p.viewsCount || 0,
                isAuthor: isAuthorPost(p),
                postNumber: sortedPosts.length - sortedPosts.indexOf(p)
            };
        });
    }

    function calculateAchievements(posts, statsTotal, username, profileInfo) {
        // Заглушка для достижений (можно расширить позже)
        return {
            level: 1,
            levelName: "🥔 Картофельное семечко",
            levelProgress: 0,
            totalExp: 0,
            nextLevelExp: 100,
            expForLevel: [],
            achievements: [],
            completedAchievements: 0,
            totalAchievements: 0,
            completionRate: 0,
            rarityColors: { common: 'var(--primary)', uncommon: '#ffd966', rare: '#ff8c42', legendary: '#ff6b6b', author: '#8B4513' },
            rarityNames: { common: 'Обычное', uncommon: 'Необычное', rare: 'Редкое', legendary: 'Легендарное', author: 'Авторское' },
            levelNames: [],
            stats: {}
        };
    }

    function getFooter() {
        return `
            <div style="margin-top:40px; text-align:center; color:var(--text-secondary); font-size:13px;">
                ITD STATS · AI‑Powered Analytics | by @Skorlange, @dmitrii_gr (ДЫМ) and KAALITION 🥔💨
            </div>
            <div style="display:flex; justify-content:center; gap:16px; margin-top:12px; flex-wrap:wrap; padding-bottom:10px;">
                <a href="https://t.me/skorlands" target="_blank" style="background:#0088cc; color:white; padding:8px 16px; border-radius:8px; text-decoration:none; font-weight:500;">ТГК Skorlange</a>
                <a href="https://www.youtube.com/@skorlange" target="_blank" style="background:#ff0000; color:white; padding:8px 16px; border-radius:8px; text-decoration:none; font-weight:500;">Ютуб Skorlange</a>
                <a href="https://www.tiktok.com/@skorlangest" target="_blank" style="background:#000; color:white; padding:8px 16px; border-radius:8px; text-decoration:none; font-weight:500;">ТТ Skorlange</a>
                <a href="https://xn--d1ah4a.com/@skorlange" target="_blank" style="background:#444; color:white; padding:8px 16px; border-radius:8px; text-decoration:none; font-weight:500;">ИТД Skorlange</a>
                <a href="https://t.me/@dmitrii_gr" target="_blank" style="background:#0088cc; color:white; padding:8px 16px; border-radius:8px; text-decoration:none; font-weight:500;">ТГ ДЫМ</a>
                <a href="https://xn--d1ah4a.com/@dmitrii_gr" target="_blank" style="background:#444; color:white; padding:8px 16px; border-radius:8px; text-decoration:none; font-weight:500;">ИТД ДЫМ</a>
            </div>
        `;
    }

    function formatStatsTable(s) {
        return `
            <div style="display: grid; gap: 10px; font-size: 14px;">
                <div style="padding: 10px 14px; background: var(--card-bg); border-radius: 8px;">
                    <span>📝 Постов</span><span style="float:right; font-weight:600;">${s.posts.toLocaleString()}</span>
                </div>
                <div style="padding: 10px 14px; background: rgba(255, 80, 120, 0.15); border-radius: 8px; border-left: 4px solid #ff6b6b;">
                    <span>❤️ Лайков</span><span style="float:right;">${s.likes.toLocaleString()}</span>
                </div>
                <div style="padding: 10px 14px; background: rgba(255, 80, 120, 0.08); border-radius: 8px;">
                    <span>Сред. лайки</span><span style="float:right;">${s.avgLikes.toLocaleString()}</span>
                </div>
                <div style="padding: 10px 14px; background: rgba(255, 80, 120, 0.08); border-radius: 8px;">
                    <span>Макс лайки</span><span style="float:right;">${s.maxLikes.toLocaleString()}</span>
                </div>
                <div style="padding: 10px 14px; background: rgba(80, 140, 255, 0.15); border-radius: 8px; border-left: 4px solid #4dabf7;">
                    <span>💬 Комментариев</span><span style="float:right;">${s.comments.toLocaleString()}</span>
                </div>
                <div style="padding: 10px 14px; background: rgba(80, 140, 255, 0.08); border-radius: 8px;">
                    <span>Сред. комм.</span><span style="float:right;">${s.avgComments.toLocaleString()}</span>
                </div>
                <div style="padding: 10px 14px; background: rgba(80, 140, 255, 0.08); border-radius: 8px;">
                    <span>Макс комм.</span><span style="float:right;">${s.maxComments.toLocaleString()}</span>
                </div>
                <div style="padding: 10px 14px; background: rgba(80, 220, 130, 0.15); border-radius: 8px; border-left: 4px solid #50dc82;">
                    <span>🔁 Репостов</span><span style="float:right;">${s.reposts.toLocaleString()}</span>
                </div>
                <div style="padding: 10px 14px; background: rgba(80, 220, 130, 0.08); border-radius: 8px;">
                    <span>Сред. репосты</span><span style="float:right;">${s.avgReposts.toLocaleString()}</span>
                </div>
                <div style="padding: 10px 14px; background: rgba(80, 220, 130, 0.08); border-radius: 8px;">
                    <span>Макс репосты</span><span style="float:right;">${s.maxReposts.toLocaleString()}</span>
                </div>
                <div style="padding: 10px 14px; background: var(--card-bg); border-radius: 8px;">
                    <span>👀 Просмотров</span><span style="float:right;">${s.views.toLocaleString()}</span>
                </div>
                <div style="padding: 10px 14px; background: var(--card-bg); border-radius: 8px;">
                    <span>Сред. просмотры</span><span style="float:right;">${s.avgViews.toLocaleString()}</span>
                </div>
                <div style="padding: 10px 14px; background: var(--card-bg); border-radius: 8px;">
                    <span>Макс просмотры</span><span style="float:right;">${s.maxViews.toLocaleString()}</span>
                </div>
                <div style="padding: 10px 14px; background: var(--card-bg); border-radius: 8px;">
                    <span>📈 ER</span><span style="float:right; color:var(--primary); font-weight:600;">${calcER(s)}%</span>
                </div>
            </div>
        `;
    }

    async function fetchFeed(token, cursor = null) {
        const limit = 20;
        let url = `/api/posts?limit=${limit}&tab=popular`;
        if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.status === 401) return null;
        if (!res.ok) return null;
        const json = await res.json();
        const posts = json?.data?.posts || [];
        const pagination = json?.data?.pagination || {};
        return { posts, hasMore: pagination.hasMore, nextCursor: pagination.nextCursor };
    }

    async function collectTrendingPosts(token, targetCount = 60) {
        let allPosts = [];
        let cursor = null;
        let attempts = 0;
        while (allPosts.length < targetCount && attempts < 10) {
            attempts++;
            const result = await fetchFeed(token, cursor);
            if (!result) break;
            const { posts, hasMore, nextCursor } = result;
            if (posts.length === 0) break;
            allPosts = allPosts.concat(posts);
            if (!hasMore) break;
            cursor = nextCursor;
        }
        console.log(`[ITD STATS] Собрано ${allPosts.length} популярных постов`);
        return allPosts.slice(0, targetCount);
    }

    async function retryWithBackoff(fn, onStatus, maxAttempts = 5, baseDelay = 10000) {
    let lastError = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            if (onStatus) onStatus(attempt, null);
            const result = await fn();
            if (onStatus) onStatus(attempt, true);
            return result;
        } catch (err) {
            lastError = err;
            // Немедленный выход при:
            // 1) ошибка помечена как noRetry
            if (err.noRetry) {
                throw err;
            }
            if (attempt === maxAttempts) break;
            const delay = attempt * baseDelay;
            if (onStatus) onStatus(attempt, false, delay);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw lastError;
}

    async function sendToOpenRouter(userPosts, trendingPosts, smartScores, onStatus, onReasoning) {
    if (!hasApiKey()) throw new Error("API ключ не задан");
            // Проверка на не‑ASCII символы в ключе
    if (!/^[\x00-\x7F]*$/.test(settings.ai.apiKey)) {
        const err = new Error("❌ API‑ключ содержит недопустимые символы. Используйте только ASCII.");
        err.noRetry = true;
        throw err;
    }

    const systemPrompt = `Ты — эксперт по социальным сетям. На основе предоставленных данных о популярных постах и твоих собственных постах, дай конкретные рекомендации по улучшению контента: какие темы, форматы, стили, время публикации работают лучше всего. Выдели ключевые паттерны успешных постов. Предложи идеи для новых постов. Если среди недооценённых постов пользователя есть такие, которые можно перезалить (имеют высокий ER, но низкие просмотры), обязательно предложи их перезалить с небольшими изменениями. Ответ должен быть структурированным, полезным и конкретным. Используй эмодзи для наглядности.`;
    let userData = "=== ПОПУЛЯРНЫЕ ПОСТЫ (тренды) ===\n";
    trendingPosts.slice(0, 40).forEach((p, i) => {
        const text = (p.content || p.text || '').slice(0, 150);
        const views = p.viewsCount || 0;
        const likes = p.likesCount || 0;
        const comments = p.commentsCount || 0;
        const reposts = p.repostsCount || 0;
        const er = views > 0 ? ((likes + comments + reposts) / views * 100).toFixed(2) : 0;
        userData += `${i+1}. [${new Date(p.createdAt).toLocaleDateString()}] ${text}... | Лайков:${likes} Комм:${comments} ER:${er}%\n`;
    });
    userData += "\n=== ВАШИ ПОСТЫ ===\n";
    userPosts.slice(0, 40).forEach((p, i) => {
        const text = (p.content || p.text || '').slice(0, 150);
        const views = p.viewsCount || 0;
        const likes = p.likesCount || 0;
        const comments = p.commentsCount || 0;
        const reposts = p.repostsCount || 0;
        const er = views > 0 ? ((likes + comments + reposts) / views * 100).toFixed(2) : 0;
        userData += `${i+1}. [${new Date(p.createdAt).toLocaleDateString()}] ${text}... | Лайков:${likes} Комм:${comments} ER:${er}%\n`;
    });
    userData += "\n=== АНАЛИТИЧЕСКИЕ ПОКАЗАТЕЛИ ===\n";
    userData += "Топ по ER: " + smartScores.topER.slice(0,3).map(p => `${p.value.toFixed(2)}%`).join(', ') + "\n";
    userData += "Топ по лайкам: " + smartScores.topLikes.slice(0,3).map(p => `${p.value}`).join(', ') + "\n";
    userData += "Недооценённые: " + smartScores.underrated.slice(0,3).map(p => `${p.value.toFixed(2)}`).join(', ') + "\n";
    userData += "Трендовые: " + smartScores.trending.slice(0,3).map(p => `${p.value.toFixed(2)}`).join(', ') + "\n";

    const requestFn = async () => {
        const headers = {
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'ITD STATS'
        };
        if (settings.ai.apiKey) headers['Authorization'] = `Bearer ${settings.ai.apiKey}`;
        const response = await fetch(settings.ai.baseUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                model: settings.ai.model,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userData }
                ],
                max_tokens: 1500,
                temperature: 0.7
            })
        });
        if (response.status == 401) {
            console.log()
            const err = new Error("❌ Неверный API‑ключ. Проверьте настройки.");
            err.noRetry = true;
            throw err;
        }
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        const data = await response.json();
        const content = data.choices[0].message.content;
        const reasoning = data.choices[0].message.reasoning;
        if (reasoning && onReasoning) onReasoning(reasoning);
        if (!content) throw new Error("ИИ не вернул содержательного ответа");
        return content;
    };

    return await retryWithBackoff(requestFn, onStatus);
}
async function fetchAITops(posts, onStatus, onReasoning) {
    if (!hasApiKey()) throw new Error("API ключ не задан");
        // Проверка на не‑ASCII символы в ключе
    if (!/^[\x00-\x7F]*$/.test(settings.ai.apiKey)) {
        const err = new Error("❌ API‑ключ содержит недопустимые символы. Используйте только ASCII.");
        err.noRetry = true;
        throw err;
    }
    const systemPrompt = `Ты — аналитик контента. На основе списка постов пользователя создай уникальные, нестандартные категории (например, "Самые смешные", "Наиболее глубокие", "Лучшие по вовлечению", "Скрытые жемчужины", "Трендовые идеи" и т.п.). Количество категорий определи сам (рекомендуется 5-10). Для каждой категории выбери до 5 постов (по ID или индексу). Верни ответ строго в формате JSON: {"categories":[{"name":"Название","posts":[{"id":"postId","reason":"почему"}]}]}. Используй только те посты, которые предоставлены. Не добавляй лишний текст, не используй reasoning. Названия категорий и причины пиши на русском языке.`;
    let postsData = posts.slice(0, 60).map((p, idx) => {
        const text = (p.content || p.text || '').slice(0, 300);
        const views = p.viewsCount || 0;
        const likes = p.likesCount || 0;
        const comments = p.commentsCount || 0;
        const reposts = p.repostsCount || 0;
        const er = views > 0 ? ((likes + comments + reposts) / views * 100).toFixed(2) : 0;
        return `ID:${p.id || p.postId || idx+1} | Дата:${new Date(p.createdAt).toLocaleDateString()} | Текст:${text} | Лайки:${likes} Комм:${comments} Репосты:${reposts} Просмотры:${views} ER:${er}%`;
    }).join("\n");

    const requestFn = async () => {
        const headers = {
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'ITD STATS'
        };
        if (settings.ai.apiKey) headers['Authorization'] = `Bearer ${settings.ai.apiKey}`;
        const response = await fetch(settings.ai.baseUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                model: settings.ai.model,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: postsData }
                ],
                max_tokens: 1500,
                temperature: 0.7
            })
        });
        if (response.status === 401) {
            const err = new Error("❌ Неверный API‑ключ. Проверьте настройки.");
            err.noRetry = true;
            throw err;
        }
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const content = data.choices[0].message.content;
        const reasoning = data.choices[0].message.reasoning;
        if (reasoning && onReasoning) onReasoning(reasoning);
        if (!content) throw new Error("ИИ не вернул содержательного ответа");
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Не удалось извлечь JSON");
        return JSON.parse(jsonMatch[0]);
    };

    return await retryWithBackoff(requestFn, onStatus);
}
    async function showAITipsModal(username, allPosts) {
        if (!hasApiKey()) {
            showToast("🔑 Для использования AI‑советов необходим API‑ключ. Укажите его в настройках.", "error", 5000);
            return;
        }
        const loadingDiv = document.createElement('div');
        loadingDiv.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: var(--bg-dark); backdrop-filter: blur(16px);
            color: white; padding: 30px 50px; border-radius: 24px;
            z-index: 10001; border: 1px solid var(--primary);
            box-shadow: 0 20px 40px rgba(0,0,0,0.4);
            text-align: center; font-size: 24px; min-width: 320px;
        `;
        loadingDiv.innerHTML = `
            <div style="margin-bottom: 20px;">${createThinkingDots()}</div>
            <div id="ai-status-message" style="margin-top: 16px; font-weight: 500;">${potatoAIPhrases.analyzing}</div>
            <div id="ai-progress" style="margin-top: 12px; font-size: 13px; color: var(--text-secondary);">${potatoAIPhrases.loading}</div>
            <div id="ai-reasoning" style="margin-top: 12px; font-size: 11px; color: #666; max-width: 400px; display: none;"></div>
        `;
        document.body.appendChild(loadingDiv);
        try {
            let token = await refreshToken();
            if (!token) throw new Error("Не удалось получить токен");
            const statusDiv = loadingDiv.querySelector('#ai-progress');
            const reasoningDiv = loadingDiv.querySelector('#ai-reasoning');
            const updateStatus = (attempt, success, delay) => {
                if (success === true) {
                    statusDiv.innerHTML = `${createSpinner(16, '#50dc82')} ${potatoAIPhrases.success}`;
                } else if (success === false && delay) {
                    statusDiv.innerHTML = `${createSpinner(16)} ${potatoAIPhrases.retry(attempt, delay)}`;
                } else if (attempt) {
                    statusDiv.innerHTML = `${createSpinner(16)} ${potatoAIPhrases.loading} Попытка ${attempt}...`;
                }
            };
            const onReasoning = (reasoning) => {
                if (reasoning) {
                    reasoningDiv.style.display = 'block';
                    reasoningDiv.innerHTML = `💭 reasoning: ${reasoning.slice(0, 200)}...`;
                }
            };
            const trendingPosts = await collectTrendingPosts(token, 60);
            const smartScores = calculateSmartScores(allPosts, username);
            const tops = prepareTopLists(allPosts, username);
            const smartTops = prepareSmartTopLists(smartScores);
            const result = await sendToOpenRouter(allPosts, trendingPosts, {
                topER: tops.topER,
                topLikes: tops.topLikes,
                underrated: smartTops.underrated,
                trending: smartTops.trending,
                cool: smartTops.cool
            }, updateStatus, onReasoning);
            loadingDiv.remove();
            const overlay = document.createElement('div');
            overlay.style.cssText = `position: fixed; inset: 0; z-index: 10000; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); display: flex; justify-content: center; align-items: center;`;
            const modal = document.createElement('div');
            modal.style.cssText = `background: var(--bg-darker); border: 1px solid var(--border); border-radius: 28px; max-width: 850px; width: 90%; max-height: 85vh; overflow-y: auto; color: var(--text); padding: 0; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); backdrop-filter: blur(4px);`;
            modal.innerHTML = `
                <div style="position: sticky; top:0; background: var(--bg-dark); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); padding: 20px 28px; border-radius: 28px 28px 0 0;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <span style="font-size:32px;">💨🔥</span>
                            <h2 style="margin:0; font-size:24px; color:var(--primary);">Картофельно-дымные советы</h2>
                        </div>
                        <button class="close-tips" style="background:rgba(255,255,255,0.1); border:none; color:#fff; font-size:24px; cursor:pointer; width:36px; height:36px; border-radius:50%; transition:0.2s;">&times;</button>
                    </div>
                </div>
                <div style="padding: 28px; line-height: 1.6; font-size: 15px;">
                    <div id="ai-advice-content">${markdownToHtml(result)}</div>
                </div>
                <div style="padding: 20px 28px; border-top: 1px solid var(--border); text-align: center;">
                    <button class="close-tips-btn" style="background:var(--primary); border:none; padding:10px 24px; border-radius:40px; color:var(--bg-dark); cursor:pointer; font-weight:500; transition:0.2s;">Закрыть</button>
                </div>
            `;
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
            const close = () => overlay.remove();
            modal.querySelectorAll('.close-tips, .close-tips-btn').forEach(btn => btn.addEventListener('click', close));
            overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
        } catch (err) {
            loadingDiv.innerHTML = `
                <div style="font-size: 64px;">💨💥</div>
                <div style="margin-top:16px;">${potatoAIPhrases.error}</div>
                <div style="margin-top: 12px; font-size: 14px; color:#f66;">${err.message}</div>
                <button id="close-error" style="margin-top:24px; background:var(--primary); border:none; padding:8px 20px; border-radius:40px; cursor:pointer;">Закрыть</button>
            `;
            const closeBtn = loadingDiv.querySelector('#close-error');
            if (closeBtn) closeBtn.addEventListener('click', () => loadingDiv.remove());
        }
    }

    async function showStatsModal(split, username, allPosts) {
        try {
            const { statsAuthor, statsGuest, statsTotal, guestPercent, erAuthor, erGuest, erTotal } = split;
            const profileInfo = getProfileInfo();
            const { displayName, avatarContent, followers, following, regDate } = profileInfo;

            // Лоадер
            const loadingDiv = document.createElement('div');
            loadingDiv.style.cssText = `
                position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                background: var(--bg-dark); backdrop-filter: blur(16px);
                color: white; padding: 30px 50px; border-radius: 24px;
                z-index: 10000; border: 1px solid var(--primary);
                box-shadow: 0 20px 40px rgba(0,0,0,0.4);
                text-align: center; font-size: 24px; min-width: 300px;
            `;
            loadingDiv.innerHTML = `
                <div style="margin-bottom: 20px;">${createSpinner(48)}</div>
                <div id="potato-message">${getRandomPotatoPhrase()}</div>
                <div style="margin-top: 20px; font-size: 14px; color: var(--text-secondary);" id="progress-message">Загружаем данные...</div>
            `;
            document.body.appendChild(loadingDiv);

            const phraseInterval = setInterval(() => {
                const msg = document.getElementById('potato-message');
                if (msg) msg.textContent = getRandomPotatoPhrase();
            }, 7000);

            const updateProgress = (p) => {
                const el = document.getElementById('progress-message');
                if (el) el.textContent = `Загружено ${p}%`;
            };
            updateProgress(25); await new Promise(r => setTimeout(r, 800));
            updateProgress(50); await new Promise(r => setTimeout(r, 800));
            updateProgress(75); await new Promise(r => setTimeout(r, 800));
            updateProgress(90); await new Promise(r => setTimeout(r, 800));

            const tops = prepareTopLists(allPosts, username);
            const smartScores = calculateSmartScores(allPosts, username);
            const smartTops = prepareSmartTopLists(smartScores);
            const history = prepareHistoryList(allPosts, username);

            clearInterval(phraseInterval);
            loadingDiv.remove();

            // Загрузка настроек
            loadSettings();

            // ========== СТИЛИ ==========
            if (!document.getElementById('itd-stats-full-style')) {
                const style = document.createElement('style');
                style.id = 'itd-stats-full-style';
                style.textContent = `
                    * {
                        scrollbar-width: thin;
                        scrollbar-color: var(--primary) #2a2a2a;
                    }
                    ::-webkit-scrollbar {
                        width: 8px;
                        height: 8px;
                    }
                    ::-webkit-scrollbar-track {
                        background: #2a2a2a;
                        border-radius: 4px;
                    }
                    ::-webkit-scrollbar-thumb {
                        background: var(--primary);
                        border-radius: 4px;
                    }
                    ::-webkit-scrollbar-thumb:hover {
                        background: var(--primary-hover);
                    }

                    .tab-btn {
                        background: none;
                        border: none;
                        padding: 12px 24px;
                        font-size: 15px;
                        font-weight: 500;
                        color: var(--text-secondary);
                        cursor: pointer;
                        transition: all 0.3s ease;
                        position: relative;
                        border-radius: 8px 8px 0 0;
                        margin: 0 2px;
                        white-space: nowrap;
                    }
                    .tab-btn:hover {
                        color: var(--primary);
                        background: rgba(0,0,0,0.1);
                    }
                    .tab-btn.active {
                        color: var(--primary);
                        background: rgba(0,0,0,0.05);
                        border-bottom: 2px solid var(--primary);
                    }

                    .tops-subtab, .history-filter, .search-filter, .settings-field {
                        padding: 8px 16px;
                        margin: 0 4px 8px 4px;
                        background: var(--input-bg);
                        border: none;
                        border-radius: 20px;
                        color: var(--text-secondary);
                        cursor: pointer;
                        font-weight: 500;
                        transition: all 0.2s;
                        font-size: 13px;
                    }
                    .tops-subtab:hover, .history-filter:hover, .search-filter:hover, .settings-field:hover {
                        background: var(--hover-bg);
                        color: var(--text);
                    }
                    .tops-subtab.active, .history-filter.active, .search-filter.active {
                        background: var(--primary);
                        color: var(--bg-dark);
                    }

                    .ai-tops-toggle {
                        display: inline-flex;
                        align-items: center;
                        gap: 10px;
                        cursor: pointer;
                        user-select: none;
                    }
                    .ai-tops-toggle input {
                        display: none;
                    }
                    .toggle-switch {
                        position: relative;
                        width: 44px;
                        height: 22px;
                        background: #444;
                        border-radius: 22px;
                        transition: 0.2s;
                    }
                    .toggle-switch::after {
                        content: "";
                        position: absolute;
                        width: 18px;
                        height: 18px;
                        background: #fff;
                        border-radius: 50%;
                        top: 2px;
                        left: 2px;
                        transition: 0.2s;
                    }
                    input:checked + .toggle-switch {
                        background: var(--primary);
                    }
                    input:checked + .toggle-switch::after {
                        left: 24px;
                    }
                    .toggle-label {
                        color: var(--text-secondary);
                        font-size: 13px;
                        transition: 0.2s;
                    }
                    input:checked ~ .toggle-label {
                        color: var(--primary);
                    }

                    .top-item, .guest-item, .history-item {
                        transition: all 0.2s ease;
                        border: 1px solid var(--border);
                        background: var(--card-bg);
                        backdrop-filter: blur(4px);
                    }
                    .top-item:hover, .guest-item:hover, .history-item:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 8px 20px rgba(0,0,0,0.3);
                        border-color: var(--primary);
                        background: var(--card-bg);
                    }

                    @media (max-width: 768px) {
                        .tab-btn {
                            padding: 8px 16px;
                            font-size: 13px;
                        }
                        .tops-subtab, .history-filter, .search-filter, .settings-field {
                            padding: 6px 12px;
                            font-size: 12px;
                        }
                        .top-item, .guest-item, .history-item {
                            padding: 10px;
                        }
                    }

                    @keyframes fadeInUp {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .tab-content {
                        animation: fadeInUp 0.3s ease-out;
                    }

                    .search-highlight {
                        background: rgba(255,180,71,0.3);
                        border-radius: 4px;
                        padding: 0 2px;
                    }

                    .settings-group {
                        background: var(--card-bg);
                        backdrop-filter: blur(4px);
                        border-radius: 16px;
                        padding: 20px;
                        margin-bottom: 24px;
                    }
                    .settings-group h4 {
                        color: var(--primary);
                        margin-bottom: 16px;
                        font-size: 18px;
                    }
                    .settings-row {
                        display: flex;
                        align-items: center;
                        gap: 16px;
                        margin-bottom: 16px;
                        flex-wrap: wrap;
                    }
                    .settings-row label {
                        min-width: 120px;
                        color: var(--text);
                    }
                    .settings-row select, .settings-row input {
                        background: var(--input-bg);
                        border: 1px solid var(--border);
                        border-radius: 8px;
                        padding: 8px 12px;
                        color: var(--text);
                        flex: 1;
                        min-width: 200px;
                    }
                    .settings-row select:focus, .settings-row input:focus {
                        outline: none;
                        border-color: var(--primary);
                    }
                    .password-wrapper {
                        flex: 1;
                        position: relative;
                        display: flex;
                        align-items: center;
                    }
                    .password-wrapper input {
                        width: 100%;
                        padding-right: 40px;
                    }
                    .toggle-password {
                        position: absolute;
                        right: 10px;
                        background: none;
                        border: none;
                        color: var(--text-secondary);
                        cursor: pointer;
                        font-size: 18px;
                        padding: 0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 30px;
                        height: 30px;
                        border-radius: 50%;
                        transition: 0.2s;
                    }
                    .toggle-password:hover {
                        background: rgba(0,0,0,0.1);
                    }
                    .settings-note {
                        font-size: 12px;
                        color: var(--text-secondary);
                        margin-top: 4px;
                    }
                    .close-stats {
    background: rgba(255,255,255,0.1);
    border: none;
    color: var(--text);
    font-size: 28px;
    cursor: pointer;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: 0.2s;
}
.close-stats:hover {
    background: rgba(255,255,255,0.2);
}
                `;
                document.head.appendChild(style);
            }

            const overlay = document.createElement('div');
            overlay.style.cssText = `position:fixed; inset:0; z-index:9999; background:rgba(0,0,0,0.85); backdrop-filter:blur(10px); display:flex; justify-content:center; align-items:center; opacity:0; transition:opacity 0.5s ease;`;

            const modal = document.createElement('div');
            modal.style.cssText = `
                background: var(--bg-darker);
                border: 1px solid var(--border);
                border-radius: 20px;
                width: 96%;
                max-width: 1300px;
                height: 90vh;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                color: var(--text);
                box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                opacity: 0;
                transform: scale(0.95);
                transition: all 0.3s ease;
                position: relative;
            `;
            applyThemeAndStyle(modal, settings);

            // HEADER
            const header = document.createElement('div');
            header.style.cssText = `
                padding: 20px 28px;
                border-bottom: 1px solid var(--border);
                display: flex;
                align-items: center;
                gap: 24px;
                flex-wrap: wrap;
                background: var(--bg-dark);
                backdrop-filter: blur(8px);
                position: sticky;
                top: 0;
                z-index: 10;
            `;
            header.innerHTML = `
                ${avatarContent}
                <div style="flex:1; min-width:220px;">
                    <div style="font-size:22px; font-weight:700; color:var(--primary);">${displayName || username || 'Профиль'}</div>
                    <div style="font-size:15px; color:var(--text-secondary); margin:4px 0 8px;">@${username || '—'}</div>
                    <div style="font-size:14px;">
                        <strong style="color:var(--primary);">Подписчики:</strong> ${followers}
                        <strong style="color:var(--primary); margin-left:16px;">Подписки:</strong> ${following}
                        <span style="color:var(--text-secondary); margin-left:16px;">${regDate}</span>
                    </div>
                </div>
                <button class="close-stats">×</button>
            `;

            // TABS
            const tabsContainer = document.createElement('div');
            tabsContainer.style.cssText = `
                display: flex;
                border-bottom: 1px solid var(--border);
                background: var(--bg-dark);
                backdrop-filter: blur(8px);
                padding: 0 20px;
                position: sticky;
                top: 0;
                z-index: 9;
                flex-wrap: wrap;
            `;
            tabsContainer.innerHTML = `
                <button class="tab-btn active" data-tab="stats">Общая статистика</button>
                <button class="tab-btn" data-tab="tops">ТОПЫ</button>
                <button class="tab-btn" data-tab="compare">Сравнение</button>
                <button class="tab-btn" data-tab="search">Поиск</button>
                <button class="tab-btn" data-tab="about">Об ITD STATS</button>
                <button class="tab-btn" data-tab="ai">AI советы</button>
                <button class="tab-btn" data-tab="settings">Настройки</button>
            `;
            const tabBtns = tabsContainer.querySelectorAll('.tab-btn');

            // SCROLLABLE CONTENT
            const contentScroll = document.createElement('div');
            contentScroll.style.cssText = `
                flex: 1;
                overflow-y: auto;
                padding: 24px 28px;
            `;

            // Вкладка статистики
            const statsTab = document.createElement('div');
            statsTab.id = 'tab-stats';
            statsTab.className = 'tab-content';
            statsTab.style.display = 'block';
            statsTab.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 32px 28px;" class="stats-grid">
                    <div><h3 style="text-align:center; margin-bottom:20px; color:var(--primary);">Посты автора</h3>${formatStatsTable(statsAuthor)}</div>
                    <div><h3 style="text-align:center; margin-bottom:20px; color:var(--primary);">Общее</h3>${formatStatsTable(statsTotal)}</div>
                    <div><h3 style="text-align:center; margin-bottom:20px; color:var(--primary);">Записи гостей</h3>${formatStatsTable(statsGuest)}</div>
                </div>
                <div style="margin-top:24px; text-align:center;">
                    <h4 style="color:var(--text-secondary); margin-bottom:8px;">Гостевые посты</h4>
                    <div style="background:var(--card-bg); backdrop-filter:blur(4px); border-radius:8px; padding:12px; max-width:400px; margin:0 auto;">
                        <div style="font-size:18px; font-weight:600; color:#ff6b6b;">${guestPercent}% (${statsGuest.posts} из ${statsTotal.posts})</div>
                        <div style="height:12px; background:var(--input-bg); border-radius:6px; margin-top:8px; overflow:hidden;">
                            <div style="width:${guestPercent}%; height:100%; background:var(--primary); transition:width 1s ease;"></div>
                        </div>
                    </div>
                </div>
                <div style="margin-top:24px; text-align:center;">
                    <h4 class="er-tooltip" style="color:var(--text-secondary); margin-bottom:8px; cursor:help;">
                        Engagement Rate (ER) 📈
                        <span class="tooltip-content" style="visibility:hidden; width:260px; background:#222; color:#eee; text-align:center; border-radius:6px; padding:10px 14px; position:absolute; z-index:10000; bottom:130%; left:50%; transform:translateX(-50%); opacity:0; transition:opacity 0.3s; border:1px solid #444; font-size:13px; line-height:1.4;">Процент вовлечённости аудитории.<br>Считается как:<br>(лайки + комментарии + репосты) / просмотры × 100%</span>
                    </h4>
                    <div style="display:flex;justify-content:center;gap:32px;flex-wrap:wrap;">
                        <div style="background:var(--card-bg); backdrop-filter:blur(4px); border-radius:8px; padding:12px; min-width:140px;"><div style="color:var(--primary);">Автор</div><div style="font-size:20px; font-weight:600;">${erAuthor}%</div></div>
                        <div style="background:var(--card-bg); backdrop-filter:blur(4px); border-radius:8px; padding:12px; min-width:140px;"><div style="color:var(--primary);">Гости</div><div style="font-size:20px; font-weight:600;">${erGuest}%</div></div>
                        <div style="background:var(--card-bg); backdrop-filter:blur(4px); border-radius:8px; padding:12px; min-width:140px;"><div style="color:var(--primary);">Общее</div><div style="font-size:20px; font-weight:600;">${erTotal}%</div></div>
                    </div>
                </div>
                ${getFooter()}
            `;

            // ТОПЫ
            const standardTopsBlock = document.createElement('div');
            standardTopsBlock.style.display = 'block';
            standardTopsBlock.innerHTML = `
                <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:8px; margin-bottom:24px; padding:0 10px;">
                    <button class="tops-subtab active" data-top="views">👀 Просмотры (${tops.topViews.length})</button>
                    <button class="tops-subtab" data-top="likes">❤️ Лайки (${tops.topLikes.length})</button>
                    <button class="tops-subtab" data-top="comments">💬 Комментарии (${tops.topComments.length})</button>
                    <button class="tops-subtab" data-top="reposts">🔁 Репосты (${tops.topReposts.length})</button>
                    <button class="tops-subtab" data-top="er">📈 ER (${tops.topER.length})</button>
                    <button class="tops-subtab" data-top="guests">👥 Гости (${tops.topGuests.length})</button>
                    <button class="tops-subtab" data-top="trending">📈 Трендовые (${smartTops.trending.length})</button>
                    <button class="tops-subtab" data-top="cool">🔥 Крутые (${smartTops.cool.length})</button>
                    <button class="tops-subtab" data-top="underrated">🤔 Недооценённые (${smartTops.underrated.length})</button>
                    <button class="tops-subtab" data-top="overrated">😬 Переоценённые (${smartTops.overrated.length})</button>
                    <button class="tops-subtab" data-top="controversial">⚖️ Спорные (${smartTops.controversial.length})</button>
                    <button class="tops-subtab" data-top="evergreen">🕰️ Долгоиграющие (${smartTops.evergreen.length})</button>
                    <button class="tops-subtab" data-top="hiddenGem">💎 Скрытые жемчужины (${smartTops.hiddenGem.length})</button>
                </div>
                <div class="tops-container">
                    ${['views','likes','comments','reposts','er','guests','trending','cool','underrated','overrated','controversial','evergreen','hiddenGem'].map(cat => `
                        <div id="tops-${cat}" class="tops-category" style="display:${cat === 'views' ? 'block' : 'none'}">
                            <h3 style="text-align:center; color:var(--primary); margin-bottom:20px;">${cat === 'views' ? 'Топ-100 по просмотрам 👀' : cat === 'likes' ? 'Топ-100 по лайкам ❤️' : cat === 'comments' ? 'Топ-100 по комментариям 💬' : cat === 'reposts' ? 'Топ-100 по репостам 🔁' : cat === 'er' ? 'Топ-100 по ER 📈' : cat === 'guests' ? 'Топ-100 активных гостей 👥' : cat === 'trending' ? 'Трендовые посты 📈' : cat === 'cool' ? 'Крутые посты 🔥' : cat === 'underrated' ? 'Недооценённые посты 🤔' : cat === 'overrated' ? 'Переоценённые посты 😬' : cat === 'controversial' ? 'Спорные посты ⚖️' : cat === 'evergreen' ? 'Долгоиграющие посты 🕰️' : 'Скрытые жемчужины 💎'}</h3>
                            <div style="display:flex; flex-direction:column; gap:8px;">
                                ${(cat === 'guests' ? tops.topGuests :
                                  cat === 'trending' ? smartTops.trending :
                                  cat === 'cool' ? smartTops.cool :
                                  cat === 'underrated' ? smartTops.underrated :
                                  cat === 'overrated' ? smartTops.overrated :
                                  cat === 'controversial' ? smartTops.controversial :
                                  cat === 'evergreen' ? smartTops.evergreen :
                                  cat === 'hiddenGem' ? smartTops.hiddenGem :
                                  cat === 'er' ? tops.topER : tops[`top${cat.charAt(0).toUpperCase() + cat.slice(1)}`] || []).map((item, i) => `
                                    <a href="${item.url || '#'}" target="_blank" style="text-decoration:none; color:inherit;">
                                        <div class="top-item" style="padding:12px; background:var(--card-bg); backdrop-filter:blur(4px); border-radius:8px; border-left:4px solid ${cat === 'views' ? 'var(--primary)' : cat === 'likes' ? 'var(--primary)' : cat === 'comments' ? '#4dabf7' : cat === 'reposts' ? '#50dc82' : cat === 'er' ? 'var(--primary)' : cat === 'guests' ? '#ff6b6b' : cat === 'trending' ? 'var(--primary)' : cat === 'cool' ? '#ff6b6b' : cat === 'underrated' ? '#ffd966' : cat === 'overrated' ? '#888' : cat === 'controversial' ? '#aa80ff' : cat === 'evergreen' ? '#50dc82' : 'var(--primary)'}">
                                            <div style="display:flex; align-items:center; gap:12px;">
                                                <span style="font-size:18px; font-weight:700; color:${cat === 'views' ? 'var(--primary)' : cat === 'likes' ? 'var(--primary)' : cat === 'comments' ? '#4dabf7' : cat === 'reposts' ? '#50dc82' : cat === 'er' ? 'var(--primary)' : cat === 'guests' ? '#ff6b6b' : cat === 'trending' ? 'var(--primary)' : cat === 'cool' ? '#ff6b6b' : cat === 'underrated' ? '#ffd966' : cat === 'overrated' ? '#888' : cat === 'controversial' ? '#aa80ff' : cat === 'evergreen' ? '#50dc82' : 'var(--primary)'}; min-width:40px;">#${i+1}</span>
                                                <div style="flex:1;">
                                                    <div style="display:flex; justify-content:space-between;">
                                                        <strong>${cat === 'guests' ? `@${item.name}` : cat === 'er' ? `${item.er}%` : item.value?.toLocaleString?.() || item.value} ${cat === 'views' ? '👀' : cat === 'likes' ? '❤️' : cat === 'comments' ? '💬' : cat === 'reposts' ? '🔁' : cat === 'er' ? '📈' : cat === 'trending' ? '🚀' : cat === 'cool' ? '🔥' : cat === 'underrated' ? '📉' : cat === 'overrated' ? '📊' : cat === 'controversial' ? '💬' : cat === 'evergreen' ? '⏳' : '💎'}</strong>
                                                        <span style="color:var(--text-secondary);">${item.date || ''}</span>
                                                    </div>
                                                    <div style="margin-top:4px; display:flex; gap:12px; font-size:12px;">
                                                        ${cat === 'guests' ? `<span>📝 ${item.count} постов</span><span>❤️ ${item.likes.toLocaleString()}</span><span>💬 ${item.comments.toLocaleString()}</span>` :
                                                          cat !== 'er' && cat !== 'trending' && cat !== 'cool' && cat !== 'underrated' && cat !== 'overrated' && cat !== 'controversial' && cat !== 'evergreen' && cat !== 'hiddenGem' ? '' :
                                                          `<span>📈 ER ${item.er?.toFixed?.(2) || '?'}%</span><span>👀 ${item.views?.toLocaleString?.() || '?'}</span>`}
                                                    </div>
                                                    <small style="color:var(--text-secondary);">${item.text || (cat === 'guests' ? '' : '')}</small>
                                                    ${item.isAuthor ? '<span style="color:var(--primary); font-size:12px; margin-left:8px;">★ автор</span>' : ''}
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                `).join('') || '<p style="text-align:center; color:var(--text-secondary);">Нет данных</p>'}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;

            const aiTopsBlock = document.createElement('div');
            aiTopsBlock.style.display = 'none';
            aiTopsBlock.innerHTML = `
                <div id="ai-tops-loading" style="text-align:center; padding:40px;">
                    <div style="margin-bottom: 16px;">${createThinkingDots()}</div>
                    <div id="ai-tops-status">${potatoAIPhrases.generating}</div>
                    <div id="ai-tops-reasoning" style="margin-top:12px; font-size:11px; color:#666; display:none;"></div>
                </div>
                <div id="ai-tops-content" style="display:none;">
                    <div id="ai-tops-subtabs" style="display:flex; flex-wrap:wrap; justify-content:center; gap:8px; margin-bottom:24px;"></div>
                    <div id="ai-tops-categories-container"></div>
                </div>
            `;

            const aiToggleRow = document.createElement('div');
            aiToggleRow.style.cssText = 'display:flex; align-items:center; justify-content:flex-end; margin-bottom:16px; gap:12px;';
            aiToggleRow.innerHTML = `
                <label class="ai-tops-toggle">
                    <input type="checkbox" id="ai-tops-toggle" ${hasApiKey() ? '' : 'disabled'}>
                    <span class="toggle-switch"></span>
                    <span class="toggle-label">💨 AI-топы</span>
                </label>
                <span class="xp-tooltip" style="font-size:12px; position:relative;">
                    ⓘ
                    <div class="xp-tooltip-content" style="visibility:hidden; width:260px; background:#222; color:#eee; text-align:center; border-radius:6px; padding:8px; position:absolute; bottom:150%; left:50%; transform:translateX(-50%); opacity:0; transition:0.2s; pointer-events:none; z-index:1000;">${hasApiKey() ? 'AI-топы создаются на основе анализа всех ваших постов. Могут быть медленнее.' : 'Для использования AI-топов необходим API‑ключ. Укажите его в настройках.'}</div>
                </span>
            `;
            const tooltipSpan = aiToggleRow.querySelector('.xp-tooltip');
            const tooltipContent = tooltipSpan.querySelector('.xp-tooltip-content');
            tooltipSpan.addEventListener('mouseenter', () => {
                tooltipContent.style.visibility = 'visible';
                tooltipContent.style.opacity = '1';
            });
            tooltipSpan.addEventListener('mouseleave', () => {
                tooltipContent.style.visibility = 'hidden';
                tooltipContent.style.opacity = '0';
            });

            const topsWrapper = document.createElement('div');
            topsWrapper.appendChild(standardTopsBlock);
            topsWrapper.appendChild(aiTopsBlock);

            const topsTab = document.createElement('div');
            topsTab.id = 'tab-tops';
            topsTab.className = 'tab-content';
            topsTab.style.display = 'none';
            topsTab.appendChild(aiToggleRow);
            topsTab.appendChild(topsWrapper);

            // Сравнение
            const compareTab = document.createElement('div');
            compareTab.id = 'tab-compare';
            compareTab.className = 'tab-content';
            compareTab.style.display = 'none';
            compareTab.innerHTML = `
                <h3 style="text-align:center; color:var(--primary); margin-bottom:20px;">Сравнение с другим профилем</h3>
                <div style="text-align:center; margin-bottom:24px;">
                    <input type="text" id="compare-username" placeholder="@ник другого профиля" style="padding:12px 16px; width:320px; max-width:90%; background:var(--card-bg); backdrop-filter:blur(4px); border:1px solid var(--border); border-radius:8px; color:var(--text); font-size:16px;">
                    <button id="compare-btn" style="margin-left:12px; padding:12px 24px; background:var(--primary); color:var(--bg-dark); border:none; border-radius:8px; cursor:pointer; font-weight:600;">Сравнить</button>
                </div>
                <div id="compare-result" style="display:none; margin-top:32px;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; margin-bottom:40px;">
                        <div style="background:var(--card-bg); backdrop-filter:blur(4px); border-radius:12px; padding:20px;"><h4 style="text-align:center; color:var(--primary); margin-bottom:16px;">@<span id="my-username">${username}</span></h4><div id="my-general"></div></div>
                        <div style="background:var(--card-bg); backdrop-filter:blur(4px); border-radius:12px; padding:20px;"><h4 style="text-align:center; color:var(--text-secondary); margin-bottom:16px;">Разница</h4><div id="diff-general"></div></div>
                        <div style="background:var(--card-bg); backdrop-filter:blur(4px); border-radius:12px; padding:20px;"><h4 style="text-align:center; color:var(--primary); margin-bottom:16px;">@<span id="other-username">—</span></h4><div id="other-general"></div></div>
                    </div>
                    ${['views','likes','comments','reposts','er'].map(metric => `
                        <div style="margin-bottom:40px;">
                            <h5 style="text-align:center; color:var(--text-secondary); margin-bottom:16px;">Топ-3 по ${metric === 'views' ? 'просмотрам 👀' : metric === 'likes' ? 'лайкам ❤️' : metric === 'comments' ? 'комментариям 💬' : metric === 'reposts' ? 'репостам 🔁' : 'ER 📈'}</h5>
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
                                <div id="my-top-${metric}" style="display:flex; flex-direction:column; gap:8px;"></div>
                                <div id="diff-top-${metric}" style="display:flex; flex-direction:column; gap:8px; justify-content:center;"></div>
                                <div id="other-top-${metric}" style="display:flex; flex-direction:column; gap:8px;"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                ${getFooter()}
            `;

            // Поиск
            const searchTab = document.createElement('div');
            searchTab.id = 'tab-search';
            searchTab.className = 'tab-content';
            searchTab.style.display = 'none';
            searchTab.innerHTML = `
                <h3 style="text-align:center; color:var(--primary); margin-bottom:20px;">🔍 Поиск по постам</h3>
                <div style="display:flex; justify-content:center; gap:12px; margin-bottom:24px; flex-wrap:wrap; align-items:center;">
<input type="text" id="search-input" placeholder="🔎 Поиск по тексту, номеру или дате (ДД.ММ.ГГГГ)" autocomplete="off" name="search_query" style="flex:1; min-width:250px; max-width:500px; padding:12px 16px; background:var(--card-bg); backdrop-filter:blur(4px); border:1px solid var(--border); border-radius:40px; color:var(--text);">                    <span id="clear-search-icon" style="cursor:pointer; font-size:20px; background:var(--primary); border-radius:50%; width:36px; height:36px; display:inline-flex; align-items:center; justify-content:center; transition:0.2s;">✕</span>
                </div>
                <div id="search-results" style="max-height: 60vh; overflow-y: auto; overflow-x: hidden;">
                    ${history.map((p, i) => `
                        <div class="history-item-wrapper" data-post-number="${p.postNumber}" data-text="${p.text.toLowerCase()}" data-date="${p.date.toLocaleDateString('ru-RU')}" style="margin-bottom:12px;">
                            <a href="${p.url || '#'}" target="_blank" style="text-decoration:none; color:inherit;">
                                <div class="history-item" style="padding:16px; background:var(--card-bg); backdrop-filter:blur(4px); border-radius:8px; border-left:4px solid ${p.isAuthor ? 'var(--primary)' : '#888'};">
                                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:8px;">
                                        <div style="display:flex; align-items:center; gap:8px;">
                                            <span class="post-number" style="font-size:14px; font-weight:bold; color:var(--primary);">#${p.postNumber}</span>
                                            <span class="post-date" style="background:var(--input-bg); padding:2px 8px; border-radius:12px; font-size:12px;">${p.date.toLocaleDateString('ru-RU')} ${p.date.toLocaleTimeString('ru-RU', {hour:'2-digit', minute:'2-digit'})}</span>
                                        </div>
                                        <div style="display:flex; gap:12px;">
                                            <span title="Лайки">❤️ ${p.likes.toLocaleString()}</span>
                                            <span title="Комментарии">💬 ${p.comments.toLocaleString()}</span>
                                            <span title="Репосты">🔁 ${p.reposts.toLocaleString()}</span>
                                            <span title="Просмотры">👀 ${p.views.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div class="post-text" style="color:var(--text); font-size:15px;">${p.text}</div>
                                    ${!p.isAuthor ? '<div style="margin-top:8px; color:var(--text-secondary); font-size:12px;">✍️ Гостевой пост</div>' : ''}
                                </div>
                            </a>
                        </div>
                    `).join('')}
                </div>
                ${getFooter()}
            `;

            // Вкладка "Об ITD STATS"
            const aboutTab = document.createElement('div');
            aboutTab.id = 'tab-about';
            aboutTab.className = 'tab-content';
            aboutTab.style.display = 'none';
            aboutTab.innerHTML = `
                <div style="max-width: 800px; margin: 0 auto;">
                    <h2 style="text-align:center; color:var(--primary); margin-bottom:24px;">🥔💨 Об ITD STATS</h2>
                    <div style="background:var(--card-bg); backdrop-filter:blur(4px); border-radius: 16px; padding: 24px; margin-bottom: 24px;">
                        <h3 style="color:var(--primary);">👥 Авторы</h3>
                        <div style="margin-top: 16px;">
                            <div style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--border);">
                                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;"><span style="font-size: 32px;">🥔</span><span style="font-size: 20px; font-weight: 600;">Skorlange</span></div>
                                <p style="color: var(--text);">Создатель первой версии ITD STATS. Разработал базовую функциональность: сбор статистики, расчёт ER, стандартные топы, достижения, историю постов и интерфейс модального окна. Именно с его работы начался проект.</p>
                                <div style="display: flex; gap: 16px; margin-top: 12px;"><a href="https://xn--d1ah4a.com/@skorlange" target="_blank" style="color:var(--primary);">ИТД</a><a href="https://t.me/skorlands" target="_blank" style="color:var(--primary);">ТГ</a><a href="https://www.youtube.com/@skorlange" target="_blank" style="color:var(--primary);">YouTube</a><a href="https://www.tiktok.com/@skorlangest" target="_blank" style="color:var(--primary);">TikTok</a></div>
                            </div>
                            <div><div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;"><span style="font-size: 32px;">💨</span><span style="font-size: 20px; font-weight: 600;">dmitrii_gr (ДЫМ)</span></div>
                            <p style="color: var(--text);">Второй автор, добавивший в скрипт "дымную" атмосферу и мощные AI-функции. Реализовал умные алгоритмы для трендовых и крутых постов, интеграцию с OpenRouter для AI-советов и ИИ-топов, а также полностью обновил интерфейс, добавив картофельно-дымный стиль, анимации, фиксированный хедер, новые вкладки и множество других улучшений.</p>
                            <div style="display: flex; gap: 16px; margin-top: 12px;"><a href="https://xn--d1ah4a.com/@dmitrii_gr" target="_blank" style="color:var(--primary);">ИТД</a><a href="https://t.me/@dmitrii_gr" target="_blank" style="color:var(--primary);">ТГ</a></div></div>
                        </div>
                    </div>
                    <div style="background:var(--card-bg); backdrop-filter:blur(4px); border-radius: 16px; padding: 24px; margin-bottom: 24px;">
                        <h3 style="color:var(--primary);">✨ Основные возможности</h3>
                        <ul style="color: var(--text); line-height: 1.8;"><li>📊 Полная статистика профиля</li><li>🔥 Умные топы</li><li>🤖 AI-советы через OpenRouter</li><li>🏷️ ИИ-топы с категоризацией</li><li>🔍 Поиск по постам</li><li>🔄 Сравнение профилей</li><li>🎨 Дымный стиль с анимациями</li><li>💨 Дымные фразы и статусы</li><li>📊 Поддержка таблиц Markdown</li></ul>
                    </div>
                    <div style="background:var(--card-bg); backdrop-filter:blur(4px); border-radius: 16px; padding: 24px;">
                        <h3 style="color:var(--primary);">📝 Как это работает</h3>
                        <p style="color: var(--text);">Скрипт собирает все посты профиля через API ИТД, вычисляет ER и другие метрики. Для анализа трендов собираются популярные посты из ленты. AI-часть использует OpenRouter с моделью openrouter/free для генерации советов и категоризации постов. Все данные обрабатываются локально в браузере, ничего не отправляется на сторонние серверы (кроме запросов к OpenRouter).</p>
                        <p style="color: var(--text); margin-top: 16px;"><strong>Приятного использования! 🥔💨</strong></p>
                    </div>
                </div>
                ${getFooter()}
            `;

            // Вкладка AI советы
            const aiTab = document.createElement('div');
            aiTab.id = 'tab-ai';
            aiTab.className = 'tab-content';
            aiTab.style.display = 'none';
            aiTab.innerHTML = `
                <h3 style="text-align:center; color:var(--primary); margin-bottom:20px;">💨 Картофельно-дымные советы</h3>
                <div style="text-align:center;">
                    <p style="color:var(--text-secondary);">${potatoAIPhrases.recommendation}</p>
                    <button id="get-ai-tips" style="background:var(--primary); border:none; padding:12px 28px; border-radius:40px; color:var(--bg-dark); font-size:16px; cursor:pointer; margin:20px 0; ${hasApiKey() ? '' : 'opacity:0.5; cursor:not-allowed;'}" ${hasApiKey() ? '' : 'disabled'}>${potatoAIPhrases.button}</button>
                    <div id="ai-loading" style="display:none;">${createThinkingDots()}</div>
                </div>
                ${getFooter()}
            `;

            // Настройки
            const settingsTab = document.createElement('div');
            settingsTab.id = 'tab-settings';
            settingsTab.className = 'tab-content';
            settingsTab.style.display = 'none';
            settingsTab.innerHTML = `
                <h3 style="text-align:center; color:var(--primary); margin-bottom:24px;">⚙️ Настройки</h3>
                <div class="settings-group">
                    <h4>🎨 Внешний вид</h4>
                    <div class="settings-row">
                        <label>Стиль:</label>
                        <select id="setting-style">
                            <option value="potato">🥔 Картошка</option>
                            <option value="smoke">💨 Дым</option>
                        </select>
                    </div>
                    <div class="settings-row">
                        <label>Тема:</label>
                        <select id="setting-theme">
                            <option value="auto">🌓 Авто (следит за системой)</option>
                            <option value="light">☀️ Светлая</option>
                            <option value="dark">🌙 Тёмная</option>
                        </select>
                    </div>
                </div>
                <div class="settings-group">
                    <h4>🤖 AI (OpenRouter)</h4>
                    <div class="settings-row">
                        <label>API Key:</label>
                        <div class="password-wrapper">
<input type="password" id="setting-ai-key" placeholder="sk-or-v1-..." autocomplete="new-password" autocomplete="off">                            <button class="toggle-password" data-target="setting-ai-key">👁️</button>
                        </div>
                    </div>
                    <div class="settings-row">
                        <label>Base URL:</label>
                        <input type="text" id="setting-ai-url" placeholder="https://openrouter.ai/api/v1/chat/completions">
                    </div>
                    <div class="settings-row">
                        <label>Модель:</label>
                        <input type="text" id="setting-ai-model" placeholder="openrouter/free">
                    </div>
                    <div class="settings-note">Настройки сохраняются автоматически.</div>
                </div>
                ${getFooter()}
            `;

            contentScroll.appendChild(statsTab);
            contentScroll.appendChild(topsTab);
            contentScroll.appendChild(compareTab);
            contentScroll.appendChild(searchTab);
            contentScroll.appendChild(aboutTab);
            contentScroll.appendChild(aiTab);
            contentScroll.appendChild(settingsTab);

            modal.appendChild(header);
            modal.appendChild(tabsContainer);
            modal.appendChild(contentScroll);
            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            // ========== ОБРАБОТЧИКИ ==========
            function switchToTab(tabId) {
                const allTabs = contentScroll.querySelectorAll('.tab-content');
                allTabs.forEach(tab => tab.style.display = 'none');
                const activeTab = document.getElementById(tabId);
                if (activeTab) activeTab.style.display = 'block';
                tabBtns.forEach(btn => btn.classList.remove('active'));
                const activeBtn = Array.from(tabBtns).find(btn => btn.dataset.tab === tabId.replace('tab-', ''));
                if (activeBtn) activeBtn.classList.add('active');
            }
            tabBtns.forEach(btn => btn.addEventListener('click', () => switchToTab(`tab-${btn.dataset.tab}`)));

            // Подвкладки в обычных топах
            const subtabs = standardTopsBlock.querySelectorAll('.tops-subtab');
            subtabs.forEach(btn => {
                btn.addEventListener('click', () => {
                    subtabs.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const categories = standardTopsBlock.querySelectorAll('.tops-category');
                    categories.forEach(cat => cat.style.display = 'none');
                    const targetId = `tops-${btn.dataset.top}`;
                    standardTopsBlock.querySelector(`#${targetId}`).style.display = 'block';
                });
            });

            // ИИ-топы toggle
            const aiToggleInput = aiToggleRow.querySelector('#ai-tops-toggle');
            aiToggleInput.addEventListener('change', async (e) => {
                if (!hasApiKey()) {
                    showToast("🔑 Для использования AI-топов необходим API-ключ. Укажите его в настройках.", "error", 5000);
                    aiToggleInput.checked = false;
                    return;
                }
                const useAI = e.target.checked;
                standardTopsBlock.style.display = useAI ? 'none' : 'block';
                aiTopsBlock.style.display = useAI ? 'block' : 'none';
                if (useAI) {
                    const loadingDiv = aiTopsBlock.querySelector('#ai-tops-loading');
                    const contentDivAI = aiTopsBlock.querySelector('#ai-tops-content');
                    const statusSpan = aiTopsBlock.querySelector('#ai-tops-status');
                    const reasoningSpan = aiTopsBlock.querySelector('#ai-tops-reasoning');
                    loadingDiv.style.display = 'block';
                    contentDivAI.style.display = 'none';
                    const updateStatus = (attempt, success, delay) => {
                        if (success === true) {
                            statusSpan.innerHTML = `${createThinkingDots()} ${potatoAIPhrases.success}`;
                        } else if (success === false && delay) {
                            statusSpan.innerHTML = `${createSpinner(20)} ${potatoAIPhrases.retry(attempt, delay)}`;
                        } else if (attempt) {
                            statusSpan.innerHTML = `${createThinkingDots()} ${potatoAIPhrases.generating} Попытка ${attempt}...`;
                        }
                    };
                    const onReasoning = (reasoning) => {
                        if (reasoning) {
                            reasoningSpan.style.display = 'block';
                            reasoningSpan.innerHTML = `💭 reasoning: ${reasoning.slice(0, 150)}...`;
                        }
                    };
                    try {
                        const result = await fetchAITops(allPosts, updateStatus, onReasoning);
                        if (result && result.categories) {
                            const subtabsContainer = aiTopsBlock.querySelector('#ai-tops-subtabs');
                            const categoriesContainer = aiTopsBlock.querySelector('#ai-tops-categories-container');
                            subtabsContainer.innerHTML = '';
                            categoriesContainer.innerHTML = '';

                            result.categories.forEach((cat, idx) => {
                                const btn = document.createElement('button');
                                btn.className = 'tops-subtab';
                                if (idx === 0) btn.classList.add('active');
                                btn.textContent = `🏷️ ${cat.name}`;
                                btn.dataset.categoryIndex = idx;
                                btn.addEventListener('click', () => {
                                    subtabsContainer.querySelectorAll('.tops-subtab').forEach(b => b.classList.remove('active'));
                                    btn.classList.add('active');
                                    categoriesContainer.querySelectorAll('.ai-category').forEach(c => c.style.display = 'none');
                                    const target = categoriesContainer.querySelector(`.ai-category[data-cat-index="${idx}"]`);
                                    if (target) target.style.display = 'block';
                                });
                                subtabsContainer.appendChild(btn);
                            });

                            result.categories.forEach((cat, idx) => {
                                const catDiv = document.createElement('div');
                                catDiv.className = 'ai-category';
                                catDiv.style.display = idx === 0 ? 'block' : 'none';
                                catDiv.dataset.catIndex = idx;
                                let postsHtml = '';
                                for (const post of cat.posts) {
                                    const postObj = allPosts.find(p => (p.id || p.postId || '').toString() === post.id.toString());
                                    if (postObj) {
                                        const author = postObj.author || {};
                                        const authorName = (author.username || author.nick || author.name || username).replace(/^@/, '');
                                        const postUrl = postObj.id ? `https://xn--d1ah4a.com/@${authorName}/post/${postObj.id}` : '#';
                                        const text = (postObj.content || postObj.text || '').slice(0, 200);
                                        postsHtml += `<a href="${postUrl}" target="_blank" style="text-decoration:none; color:inherit;">
                                            <div class="top-item" style="padding:16px; background:var(--card-bg); backdrop-filter:blur(4px); border-radius:8px; border-left:4px solid var(--primary); margin-bottom:12px;">
                                                <div style="display:flex; gap:12px;">
                                                    <div style="flex:1;">
                                                        <div style="color:var(--primary); font-weight:600; margin-bottom:8px;">${post.reason || 'Особенный пост'}</div>
                                                        <div style="color:var(--text);">${text}...</div>
                                                        <div style="margin-top:8px; display:flex; gap:12px; font-size:12px; color:var(--text-secondary);">
                                                            <span>❤️ ${postObj.likesCount || 0}</span>
                                                            <span>💬 ${postObj.commentsCount || 0}</span>
                                                            <span>👀 ${postObj.viewsCount || 0}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </a>`;
                                    }
                                }
                                catDiv.innerHTML = postsHtml || '<p style="text-align:center; color:var(--text-secondary);">Нет постов</p>';
                                categoriesContainer.appendChild(catDiv);
                            });
                        } else {
                            contentDivAI.innerHTML = '<p style="text-align:center; color:#f66;">' + potatoAIPhrases.error + '</p>';
                        }
                    } catch (err) {
                        console.error(err);
                        contentDivAI.innerHTML = `<p style="text-align:center; color:#f66;">${potatoAIPhrases.error}<br>${err.message}</p>`;
                    } finally {
                        loadingDiv.style.display = 'none';
                        contentDivAI.style.display = 'block';
                    }
                }
            });

            // Динамический поиск
            const searchInput = searchTab.querySelector('#search-input');
            const clearIcon = searchTab.querySelector('#clear-search-icon');
            const searchResultsDiv = searchTab.querySelector('#search-results');
            const allSearchItems = searchTab.querySelectorAll('.history-item-wrapper');

            function clearHighlights() {
                allSearchItems.forEach(item => {
                    const textDiv = item.querySelector('.post-text');
                    if (textDiv) {
                        textDiv.innerHTML = textDiv.innerHTML.replace(/<span class="search-highlight">(.*?)<\/span>/g, '$1');
                    }
                });
            }

            function performSearch() {
                const query = searchInput.value.trim().toLowerCase();
                clearHighlights();
                if (!query) {
                    allSearchItems.forEach(item => item.style.display = 'block');
                    const existingNoResults = searchResultsDiv.querySelector('.no-results');
                    if (existingNoResults) existingNoResults.remove();
                    return;
                }
                let anyFound = false;
                allSearchItems.forEach(item => {
                    const postNumber = item.dataset.postNumber;
                    const postText = item.dataset.text;
                    const postDate = item.dataset.date;
                    const matchesNumber = postNumber === query;
                    const matchesText = postText.includes(query);
                    const matchesDate = postDate === query;
                    if (matchesNumber || matchesText || matchesDate) {
                        item.style.display = 'block';
                        anyFound = true;
                        const textDiv = item.querySelector('.post-text');
                        if (textDiv && matchesText) {
                            const originalText = textDiv.innerHTML;
                            const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                            textDiv.innerHTML = originalText.replace(regex, '<span class="search-highlight">$1</span>');
                        }
                    } else {
                        item.style.display = 'none';
                    }
                });
                const existingNoResults = searchResultsDiv.querySelector('.no-results');
                if (!anyFound) {
                    if (!existingNoResults) {
                        const noResults = document.createElement('div');
                        noResults.className = 'no-results';
                        noResults.style.textAlign = 'center';
                        noResults.style.padding = '40px';
                        noResults.style.color = 'var(--text-secondary)';
                        noResults.textContent = '🔍 Ничего не найдено';
                        searchResultsDiv.appendChild(noResults);
                    }
                } else if (existingNoResults) {
                    existingNoResults.remove();
                }
            }

            function clearSearch() {
                searchInput.value = '';
                clearHighlights();
                allSearchItems.forEach(item => item.style.display = 'block');
                const existingNoResults = searchResultsDiv.querySelector('.no-results');
                if (existingNoResults) existingNoResults.remove();
            }

            searchInput.addEventListener('input', performSearch);
            clearIcon.addEventListener('click', clearSearch);

            // Кнопка AI-советов
const aiBtn = aiTab.querySelector('#get-ai-tips');
if (aiBtn) {
    aiBtn.addEventListener('click', async () => {
        if (!hasApiKey()) {
            showToast("🔑 Для использования AI-советов необходим API-ключ. Укажите его в настройках.", "error", 5000);
            return;
        }
        aiBtn.disabled = true;
        aiBtn.textContent = '💨 Дымим...';
        const loadingDiv = aiTab.querySelector('#ai-loading');
        if (loadingDiv) loadingDiv.style.display = 'block';
        try {
            await showAITipsModal(username, allPosts);
        } catch (err) {
            showToast(`Ошибка: ${err.message}`, "error", 5000);
        } finally {
            aiBtn.disabled = false;
            aiBtn.textContent = potatoAIPhrases.button;
            if (loadingDiv) loadingDiv.style.display = 'none';
        }
    });
}
            // Настройки: автосохранение
            const styleSelect = settingsTab.querySelector('#setting-style');
            const themeSelect = settingsTab.querySelector('#setting-theme');
            const aiKeyInput = settingsTab.querySelector('#setting-ai-key');
            const aiUrlInput = settingsTab.querySelector('#setting-ai-url');
            const aiModelInput = settingsTab.querySelector('#setting-ai-model');
            const toggleButtons = settingsTab.querySelectorAll('.toggle-password');

            function updateSettingsUI() {
                styleSelect.value = settings.style;
                themeSelect.value = settings.theme;
                aiKeyInput.value = settings.ai.apiKey;
                aiUrlInput.value = settings.ai.baseUrl;
                aiModelInput.value = settings.ai.model;
                applyThemeAndStyle(modal, settings);
                modal.classList.remove('theme-auto', 'theme-light', 'theme-dark', 'style-potato', 'style-smoke');
                modal.classList.add(`theme-${settings.theme}`);
                modal.classList.add(`style-${settings.style}`);
                if (settings.theme === 'auto') {
                    const htmlTheme = document.documentElement.getAttribute('data-theme') || 'dark';
                    modal.classList.add(`theme-${htmlTheme}`);
                }
                // Обновляем состояние AI-элементов
                const aiToggle = aiToggleRow.querySelector('#ai-tops-toggle');
                const aiButton = aiTab.querySelector('#get-ai-tips');
                const hasKey = hasApiKey();
                if (aiToggle) {
                    aiToggle.disabled = !hasKey;
                    if (!hasKey && aiToggle.checked) {
                        aiToggle.checked = false;
                        standardTopsBlock.style.display = 'block';
                        aiTopsBlock.style.display = 'none';
                    }
                }
                if (aiButton) {
                    aiButton.disabled = !hasKey;
                    aiButton.style.opacity = hasKey ? '1' : '0.5';
                    aiButton.style.cursor = hasKey ? 'pointer' : 'not-allowed';
                }
                const tooltipDiv = aiToggleRow.querySelector('.xp-tooltip .xp-tooltip-content');
                if (tooltipDiv) {
                    tooltipDiv.textContent = hasKey ? 'AI-топы создаются на основе анализа всех ваших постов. Могут быть медленнее.' : 'Для использования AI-топов необходим API‑ключ. Укажите его в настройках.';
                }
            }

            function saveAndApply() {
                settings.style = styleSelect.value;
                settings.theme = themeSelect.value;
                settings.ai.apiKey = aiKeyInput.value;
                settings.ai.baseUrl = aiUrlInput.value;
                settings.ai.model = aiModelInput.value;
                saveSettings();
                updateSettingsUI();
                showToast("✅ Настройки сохранены", "info", 2000);
            }

            toggleButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const targetId = btn.dataset.target;
                    const input = settingsTab.querySelector(`#${targetId}`);
                    if (input) {
                        if (input.type === 'password') {
                            input.type = 'text';
                            btn.textContent = '🙈';
                        } else {
                            input.type = 'password';
                            btn.textContent = '👁️';
                        }
                    }
                });
            });

            updateSettingsUI();
            styleSelect.addEventListener('change', saveAndApply);
            themeSelect.addEventListener('change', saveAndApply);
            aiKeyInput.addEventListener('input', saveAndApply);
            aiUrlInput.addEventListener('input', saveAndApply);
            aiModelInput.addEventListener('input', saveAndApply);

            // Сравнение
            contentScroll.addEventListener('click', async e => {
                if (e.target.id !== 'compare-btn') return;
                const input = compareTab.querySelector('#compare-username');
                let compareUsername = input.value.trim().replace(/^@/, '');
                if (!compareUsername) { alert('Введите @ник другого профиля'); return; }
                const resultDiv = compareTab.querySelector('#compare-result');
                resultDiv.style.display = 'block';
                const otherGeneral = compareTab.querySelector('#other-general');
                const diffGeneral = compareTab.querySelector('#diff-general');
                const otherUsernameSpan = compareTab.querySelector('#other-username');
                otherUsernameSpan.textContent = compareUsername;
                otherGeneral.innerHTML = '<div style="text-align:center;">' + createSpinner(24) + '</div>';
                diffGeneral.innerHTML = '<div style="text-align:center;">' + createSpinner(24) + '</div>';
                try {
                    const comparePosts = await fetchPosts(compareUsername);
                    if (!comparePosts || comparePosts.length === 0) throw new Error('Пользователь не найден или нет постов');
                    const compareSplit = calculateSplitStats(comparePosts, compareUsername);
                    const diffFormat = (a, b, isPercent = false) => {
                        const diff = a - b;
                        if (diff === 0) return '<span style="color:#888;">0</span>';
                        const sign = diff > 0 ? '+' : '';
                        const color = diff > 0 ? '#4caf50' : '#f44336';
                        const value = isPercent ? diff.toFixed(2) : Math.round(diff).toLocaleString();
                        return `<span style="color:${color}; font-weight:600;">${sign}${value}${isPercent ? '%' : ''}</span>`;
                    };
                    const myGeneralHTML = `<table style="width:100%;">${['posts','likes','comments','reposts','views'].map(m => `      <tr><td>📝 ${m==='posts'?'Постов':m==='likes'?'Лайков':m==='comments'?'Комментариев':m==='reposts'?'Репостов':'Просмотров'}</td><td style="text-align:right;">${statsTotal[m].toLocaleString()}</td></tr>`).join('')}<tr><td>📈 ER</td><td style="text-align:right; color:var(--primary);">${erTotal}%</td></tr><tr><td>📊 Гости</td><td style="text-align:right;">${guestPercent}%</td></tr></table>`;
                    const otherGeneralHTML = `<table style="width:100%;">${['posts','likes','comments','reposts','views'].map(m => `      <tr><td>📝 ${m==='posts'?'Постов':m==='likes'?'Лайков':m==='comments'?'Комментариев':m==='reposts'?'Репостов':'Просмотров'}</td><td style="text-align:right;">${compareSplit.statsTotal[m].toLocaleString()}</td></tr>`).join('')}<tr><td>📈 ER</td><td style="text-align:right; color:var(--primary);">${compareSplit.erTotal}%</td></tr><tr><td>📊 Гости</td><td style="text-align:right;">${compareSplit.guestPercent}%</td></tr></table>`;
                    const diffGeneralHTML = `<table style="width:100%;">${['posts','likes','comments','reposts','views'].map(m => `      <tr><td>📝 ${m==='posts'?'Постов':m==='likes'?'Лайков':m==='comments'?'Комментариев':m==='reposts'?'Репостов':'Просмотров'}</td><td style="text-align:right;">${diffFormat(statsTotal[m], compareSplit.statsTotal[m])}</td></tr>`).join('')}<tr><td>📈 ER</td><td style="text-align:right;">${diffFormat(Number(erTotal), Number(compareSplit.erTotal), true)}</td></tr><tr><td>📊 Гости</td><td style="text-align:right;">${diffFormat(guestPercent, compareSplit.guestPercent, true)}</td></tr></table>`;
                    compareTab.querySelector('#my-general').innerHTML = myGeneralHTML;
                    compareTab.querySelector('#other-general').innerHTML = otherGeneralHTML;
                    compareTab.querySelector('#diff-general').innerHTML = diffGeneralHTML;

                    const metrics = ['viewsCount','likesCount','commentsCount','repostsCount'];
                    const getTopPosts = (posts, sortKey, limit=3) => [...posts].sort((a,b)=> (b[sortKey]||0)-(a[sortKey]||0)).slice(0,limit).map(p=>({value:p[sortKey]||0, date:new Date(p.createdAt||p.created_at).toLocaleDateString('ru-RU'), url:p.id?`https://xn--d1ah4a.com/@${p.author?.username||username}/post/${p.id}`:'#'}));
                    metrics.forEach(metric => {
                        const myTop = getTopPosts(allPosts, metric);
                        const otherTop = getTopPosts(comparePosts, metric);
                        let myHTML='', otherHTML='', diffHTML='';
                        for(let i=0;i<3;i++){
                            const my = myTop[i] || {value:0, date:'-', url:'#'};
                            const other = otherTop[i] || {value:0, date:'-', url:'#'};
                            myHTML += `<a href="${my.url}" target="_blank" style="display:block;"><div style="padding:8px; background:rgba(0,0,0,0.3); border-radius:6px;"><strong>${i+1}.</strong> ${my.value.toLocaleString()}<br><small>${my.date}</small></div></a>`;
                            otherHTML += `<a href="${other.url}" target="_blank" style="display:block;"><div style="padding:8px; background:rgba(0,0,0,0.3); border-radius:6px;"><strong>${i+1}.</strong> ${other.value.toLocaleString()}<br><small>${other.date}</small></div></a>`;
                            const diff = my.value - other.value;
                            const color = diff>0?'#4caf50':diff<0?'#f44336':'#888';
                            const sign = diff>0?'+':'';
                            diffHTML += `<div style="padding:8px; background:rgba(0,0,0,0.3); border-radius:6px; text-align:center;"><span style="color:${color};">${sign}${diff.toLocaleString()}</span></div>`;
                        }
                        const metricName = metric === 'viewsCount' ? 'views' : metric === 'likesCount' ? 'likes' : metric === 'commentsCount' ? 'comments' : 'reposts';
                        compareTab.querySelector(`#my-top-${metricName}`).innerHTML = myHTML;
                        compareTab.querySelector(`#other-top-${metricName}`).innerHTML = otherHTML;
                        compareTab.querySelector(`#diff-top-${metricName}`).innerHTML = diffHTML;
                    });
                    const calcERPost = p => { const v=p.viewsCount||0; const e=(p.likesCount||0)+(p.commentsCount||0)+(p.repostsCount||0); return v>0?e/v*100:0; };
                    const myTopER = [...allPosts].map(p=>({er:calcERPost(p), date:new Date(p.createdAt).toLocaleDateString('ru-RU'), url:p.id?`https://xn--d1ah4a.com/@${p.author?.username||username}/post/${p.id}`:'#'})).filter(p=>p.er>0).sort((a,b)=>b.er-a.er).slice(0,3);
                    const otherTopER = [...comparePosts].map(p=>({er:calcERPost(p), date:new Date(p.createdAt).toLocaleDateString('ru-RU'), url:p.id?`https://xn--d1ah4a.com/@${p.author?.username||compareUsername}/post/${p.id}`:'#'})).filter(p=>p.er>0).sort((a,b)=>b.er-a.er).slice(0,3);
                    let myErHTML='', otherErHTML='', diffErHTML='';
                    for(let i=0;i<3;i++){
                        const my = myTopER[i] || {er:0, date:'-', url:'#'};
                        const other = otherTopER[i] || {er:0, date:'-', url:'#'};
                        myErHTML += `<a href="${my.url}" target="_blank"><div style="padding:8px; background:rgba(0,0,0,0.3); border-radius:6px;"><strong>${i+1}.</strong> ${my.er.toFixed(2)}%<br><small>${my.date}</small></div></a>`;
                        otherErHTML += `<a href="${other.url}" target="_blank"><div style="padding:8px; background:rgba(0,0,0,0.3); border-radius:6px;"><strong>${i+1}.</strong> ${other.er.toFixed(2)}%<br><small>${other.date}</small></div></a>`;
                        const diff = my.er - other.er;
                        const color = diff>0?'#4caf50':diff<0?'#f44336':'#888';
                        const sign = diff>0?'+':'';
                        diffErHTML += `<div style="padding:8px; background:rgba(0,0,0,0.3); border-radius:6px; text-align:center;"><span style="color:${color};">${sign}${diff.toFixed(2)}%</span></div>`;
                    }
                    compareTab.querySelector('#my-top-er').innerHTML = myErHTML;
                    compareTab.querySelector('#other-top-er').innerHTML = otherErHTML;
                    compareTab.querySelector('#diff-top-er').innerHTML = diffErHTML;
                } catch(err) {
                    console.error(err);
                    otherGeneral.innerHTML = '<div style="color:#f66; text-align:center;">❌ Пользователь не найден или нет постов</div>';
                    diffGeneral.innerHTML = '';
                }
            });

            // Закрытие
            const closeBtn = header.querySelector('.close-stats');
            closeBtn.addEventListener('click', () => {
                modal.style.opacity = '0';
                modal.style.transform = 'scale(0.95)';
                overlay.style.opacity = '0';
                setTimeout(() => overlay.remove(), 300);
            });
            overlay.addEventListener('click', e => { if (e.target === overlay) closeBtn.click(); });

            setTimeout(() => {
                overlay.style.opacity = '1';
                modal.style.opacity = '1';
                modal.style.transform = 'scale(1)';
            }, 50);
        } catch (err) {
            console.error("[ITD STATS] Ошибка:", err);
            alert("Не удалось открыть статистику\n" + (err.message || err));
        }
    }

    // ========== КНОПКА СТАТИСТИКИ ==========
    function tryAddStatsBlock() {
        if (document.querySelector('.itd-stats-btn')) return;
        const statsBlock = document.querySelector('div.-rjihNlb, div[class*="-rjihNlb"]');
        if (!statsBlock) return;
        const username = getUsername();
        if (!username) return;
        const statsBtn = document.createElement('div');
        statsBtn.className = 'hSN99swS wD-vYWrg itd-stats-btn';
        statsBtn.style.cssText = 'cursor:pointer; user-select:none; display:flex; align-items:center; gap:4px; background:linear-gradient(135deg, #ffb347, #ff8c42); border-radius:20px; padding:8px 16px; transition:0.2s;';
        statsBtn.innerHTML = `<span class="LIXEFTYA" style="color:#1a1a1a;">Статистика</span><span class="XHEEbVAb" style="color:#1a1a1a;">профиля</span>`;
        statsBtn.addEventListener('click', async () => {
            const phrase = getRandomPotatoPhrase();
            statsBtn.innerHTML = `<span class="LIXEFTYA" style="color:#1a1a1a;">${phrase}</span>`;
            statsBtn.style.opacity = '0.8';
            statsBtn.style.pointerEvents = 'none';
            try {
                const posts = await fetchPosts(username);
                const split = calculateSplitStats(posts, username);
                await showStatsModal(split, username, posts);
            } catch (err) {
                console.error(err);
                alert("Ошибка: " + err.message);
            } finally {
                statsBtn.innerHTML = `<span class="LIXEFTYA" style="color:#1a1a1a;">Статистика</span><span class="XHEEbVAb" style="color:#1a1a1a;">профиля</span>`;
                statsBtn.style.opacity = '1';
                statsBtn.style.pointerEvents = 'auto';
            }
        });
        statsBlock.appendChild(statsBtn);
        console.log("[ITD STATS] Кнопка добавлена");
    }

    setTimeout(tryAddStatsBlock, 1500);
    const observer = new MutationObserver(() => {
        if (window.location.pathname.includes('@') && !document.querySelector('.itd-stats-btn')) tryAddStatsBlock();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    [2000, 4000, 8000].forEach(d => setTimeout(tryAddStatsBlock, d));
})();
