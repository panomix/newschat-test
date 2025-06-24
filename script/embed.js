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
            error: 'newschat-error'
        }
    };

    const STYLES = `
        .newschat-question {
            margin: 1.5rem 0;
            padding: 1rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            line-height: 1.5;
            word-break: keep-all;
            max-width: 100%; /* or set to a specific width like 600px */
        }


        .newschat-link {
            display: block;
            font-size: 1rem;
            line-height: 1.4;
            word-wrap: break-word;
            white-space: normal;
            color: white; /* Changed to white */
            text-align: center; /* Center the text horizontally */
        }

        .newschat-link:hover {
            text-decoration: underline;
        }

        .newschat-loading {
            text-align: center;
            padding: 2rem;
            color: #666;
        }

        .newschat-error {
            padding: 1rem;
            background: #fee;
            color: #c33;
            border-radius: 8px;
            border: 1px solid #fcc;
        }

        .newschat-spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 2px solid #ddd;
            border-radius: 50%;
            border-top-color: #667eea;
            animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
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
            const cleanUrl = rawUrl.split('?')[0];
            return cleanUrl;
            
        }

        init() {
            if (this.initialized) return;
            this.initialized = true;
            this.injectStyles();

            this.loadQuestions();
        }

        injectStyles() {
            if (document.getElementById('newschat-styles')) return;
            const style = document.createElement('style');
            style.id = 'newschat-styles';
            style.textContent = STYLES;
            document.head.appendChild(style);
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
                    console.log(`NewsChat: Inserting ${data.questions.length} questions into the document.`);
                    this.insertQuestionsWithContext(data.questions);
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
            const paragraphs = Array.from(document.querySelectorAll("p"));

            questions.forEach(q => {
                let inserted = false;

                if (typeof q.insert_after_paragraph === "number") {
                    const idx = q.insert_after_paragraph;
                    if (paragraphs[idx]) {
                        const target = paragraphs[idx];
                        const block = this.createQuestionBlock(q);
                        target.parentNode.insertBefore(block, target.nextSibling);
                        inserted = true;
                    }
                }

                if (!inserted && typeof q.insert_after_text === "string") {
                    for (const p of paragraphs) {
                        if (p.innerText.includes(q.insert_after_text)) {
                            const block = this.createQuestionBlock(q);
                            p.parentNode.insertBefore(block, p.nextSibling);
                            inserted = true;
                            break;
                        }
                    }
                }

                if (!inserted) {
                    console.warn("NewsChat: Could not insert question dynamically, appending to body.");
                    document.body.appendChild(this.createQuestionBlock(q));
                }
            });
        }

        createQuestionBlock(question) {
            const div = document.createElement("div");
            div.className = CONFIG.CSS_CLASSES.container;

            const link = document.createElement("a");
            link.href = question.url;
            link.className = CONFIG.CSS_CLASSES.link;
            link.textContent = question.text;
            link.target = "_blank";
            link.rel = "noopener noreferrer";

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
