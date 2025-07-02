/**
 * NewsChat Embed Script
 */

(function() {
    'use strict';

    const CONFIG = {
        API_BASE_URL: 'https://newschat.calmsand-7f1bdb84.koreacentral.azurecontainerapps.io',
        SCROLL_THRESHOLD: 0.25,
        INSERTION_SELECTORS: [
            'article',
            '.article-content',
            '.post-content',
            '.entry-content',
            '.content',
            'main',
            'body'
        ],
        CSS_CLASSES: {
            container: 'newschat-question',
            link: 'newschat-link',
            loading: 'newschat-loading',
            error: 'newschat-error',
            popup: 'newschat-popup',
            popupOverlay: 'newschat-popup-overlay',
            popupContent: 'newschat-popup-content',
            popupClose: 'newschat-popup-close',
            popupLink: 'newschat-popup-link'
        }
    };
    const STYLES = `
    .newschat-question {
        display: block;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.5;
        word-break: keep-all;
        cursor: pointer;
    }

    .newschat-link {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        border-radius: 12px;
        text-decoration: none;
        transition: background-color 0.2s ease;
        background-color: transparent;
        cursor: pointer;
    }

    .newschat-link:hover {
        background-color: rgba(0, 122, 255, 0.08);
    }

    .newschat-arrow {
        font-size: 1rem;
        color: #007aff;
        flex-shrink: 0;
    }

    .newschat-text {
        font-size: 1rem;
        color: #007aff;
        white-space: normal;
        flex-grow: 1;
    }

    .newschat-badge {
        box-sizing: border-box;
        width: 83px;
        height: 35px;
        border-radius: 20px;
        font-family: 'Noto Sans KR', sans-serif;
        font-style: normal;
        font-weight: 700;
        font-size: 14px;
        line-height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        background: linear-gradient(106.13deg, #0085FF -13.69%, #E978E9 131.77%);
        color: white;
        white-space: nowrap;
        cursor: pointer;
        flex-shrink: 0;
    }

    .newschat-error {
        padding: 1rem;
        background: #fee;
        color: #c33;
        border-radius: 8px;
        border: 1px solid #fcc;
    }

    .newschat-popup-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
    }

    .newschat-popup-overlay.show {
        opacity: 1;
        visibility: visible;
    }

    .newschat-popup-content {
        background: white;
        border-radius: 16px;
        padding: 2rem;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        position: relative;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        transform: scale(0.9);
        transition: transform 0.3s ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
    }

    .newschat-popup-overlay.show .newschat-popup-content {
        transform: scale(1);
    }

    .newschat-popup-close {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #666;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s ease;
    }

    .newschat-popup-close:hover {
        background-color: #f0f0f0;
    }

    .newschat-popup-title {
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 1rem;
        color: #333;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        text-align: center;
    }

    .newschat-popup-description {
        font-size: 1rem;
        line-height: 1.6;
        color: #666;
        margin-bottom: 1.5rem;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        text-align: center;
    }

    .newschat-popup-link {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        background: linear-gradient(106.13deg, #0085FF -13.69%, #E978E9 131.77%);
        color: white;
        text-decoration: none;
        border-radius: 12px;
        font-weight: 600;
        font-size: 1rem;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .newschat-popup-link:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 20px rgba(0, 133, 255, 0.3);
    }

    .newschat-popup-iframe {
        width: 100%;
        max-width: 480px;
        height: 300px;
        border: none;
        border-radius: 8px;
        margin: 0 auto;
    }
`;

    class NewsChatEmbed {
        constructor() {
            this.initialized = false;
            this.questionsLoaded = false;
            this.articleUrl = this.getArticleUrl();
            if (!this.articleUrl) {
                console.warn('NewsChat: No article URL found');
                return;
            }
            this.init();
        }

        getArticleUrl() {
            const script = document.currentScript || document.querySelector('script[src*="embed.js"]');
            const rawUrl = script?.getAttribute('data-article-url') || window.location.href;
            return rawUrl;
        }

        init() {
            if (this.initialized) return;
            this.initialized = true;
            this.injectStyles();
            this.createPopupContainer();

            this.loadQuestions();
        }

        injectStyles() {
            if (document.getElementById('newschat-styles')) return;
            const style = document.createElement('style');
            style.id = 'newschat-styles';
            style.textContent = STYLES;
            document.head.appendChild(style);
        }

        createPopupContainer() {
            if (document.getElementById('newschat-popup')) return;
            
            const popupOverlay = document.createElement('div');
            popupOverlay.id = 'newschat-popup';
            popupOverlay.className = CONFIG.CSS_CLASSES.popupOverlay;
            
            const popupContent = document.createElement('div');
            popupContent.className = CONFIG.CSS_CLASSES.popupContent;
            
            const closeButton = document.createElement('button');
            closeButton.className = CONFIG.CSS_CLASSES.popupClose;
            closeButton.innerHTML = '×';
            closeButton.addEventListener('click', () => this.hidePopup());
            
            const title = document.createElement('h3');
            title.className = 'newschat-popup-title';
            title.textContent = 'AI 답변 보기';
            
            const description = document.createElement('p');
            description.className = 'newschat-popup-description';
            description.textContent = '아래 링크를 클릭하여 AI 답변을 확인하세요.';
            
            const linkContainer = document.createElement('div');
            linkContainer.id = 'newschat-popup-link-container';
            
            popupContent.appendChild(closeButton);
            popupContent.appendChild(title);
            popupContent.appendChild(description);
            popupContent.appendChild(linkContainer);
            popupOverlay.appendChild(popupContent);
            
            // Close popup when clicking overlay
            popupOverlay.addEventListener('click', (e) => {
                if (e.target === popupOverlay) {
                    this.hidePopup();
                }
            });
            
            // Close popup with Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isPopupVisible()) {
                    this.hidePopup();
                }
            });
            
            document.body.appendChild(popupOverlay);
        }

        async loadQuestions() {
            if (this.questionsLoaded) {
                console.log('NewsChat: Questions already loaded.');
                return;
            }
            this.questionsLoaded = true;
            console.log('NewsChat: Starting to load questions.');
            console.log(this.articleUrl);

            try {
                console.log('NewsChat: Fetching questions from API.');
                const response = await fetch(`${CONFIG.API_BASE_URL}/generate_questions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: this.articleUrl })
                });

                if (!response.ok) {
                    console.error(`NewsChat: Failed to fetch questions. HTTP ${response.status}`);
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();
                console.log('NewsChat: Questions fetched successfully.');

                if (Array.isArray(data.questions) && data.questions.length > 0) {
                    // Filter out affiliate questions - only show regular questions
                    const regularQuestions = data.questions.filter(q => !q.affiliate);
                    console.log(`NewsChat: Found ${regularQuestions.length} regular questions.`);
                    
                    if (regularQuestions.length > 0) {
                        console.log(`NewsChat: Inserting ${regularQuestions.length} questions into the document.`);
                        this.insertQuestionsWithContext(regularQuestions);
                    } else {
                        console.log('NewsChat: No regular questions available to insert.');
                    }
                } else {
                    console.log('NewsChat: No questions available to insert.');
                }

            }
            catch (error) {
                console.error('NewsChat: Error loading questions:', error);
                const errorElement = this.createErrorElement();
                document.body.appendChild(errorElement);
            }
        }

        insertQuestionsWithContext(questions) {
            const paragraphsAndListItems = Array.from(document.querySelectorAll("p, li"));

            questions.forEach(q => {
                let inserted = false;

                for (const element of paragraphsAndListItems) {
                    console.log("Checking element:", element.textContent);
                    if (q.insert_after_paragraph && element.textContent.includes(q.insert_after_paragraph)) {
                        console.log("Found matching element for:", q.insert_after_paragraph);
                        const block = this.createQuestionBlock(q);
                        element.parentNode.insertBefore(block, element.nextSibling);
                        inserted = true;
                        break;
                    }
                }
                if (!inserted) {
                    console.warn("No match for:", q.insert_after_paragraph);
                }

            });
        }

        createQuestionBlock(question) {
            const div = document.createElement("div");
            div.className = CONFIG.CSS_CLASSES.container;
        
            const link = document.createElement("a");
            link.href = question.url;
            link.className = CONFIG.CSS_CLASSES.link;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
        
            const arrow = document.createElement("span");
            arrow.className = "newschat-arrow";
            arrow.textContent = "↳";
        
            const textSpan = document.createElement("span");
            textSpan.className = "newschat-text";
            textSpan.textContent = question.text;
        
            const badge = document.createElement("span");
            badge.className = "newschat-badge";
            badge.textContent = "AI 답변보기";
        
            link.appendChild(arrow);
            link.appendChild(textSpan);
            link.appendChild(badge);
            div.appendChild(link);
            return div;
        }
        
        createErrorElement() {
            const div = document.createElement('div');
            div.className = CONFIG.CSS_CLASSES.error;
            div.innerHTML = `<p>Unable to load questions at this time. Please try again later.</p>`;
            return div;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new NewsChatEmbed());
    } else {
        new NewsChatEmbed();
    }
})();
