/**
 * NewsChat Affiliate Embed Script
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
            container: 'newschat-affiliate-container',
            highlightedText: 'newschat-highlighted-text',
            magicWand: 'newschat-magic-wand',
            popup: 'newschat-popup',
            popupOverlay: 'newschat-popup-overlay',
            popupContent: 'newschat-popup-content',
            popupClose: 'newschat-popup-close',
            popupLink: 'newschat-popup-link'
        }
    };

    const STYLES = `
    .newschat-affiliate-container {
        position: relative;
        display: inline-block;
        margin: 0.5rem 0;
        cursor: pointer;
        transition: transform 0.2s ease;
    }

    .newschat-affiliate-container:hover {
        transform: scale(1.02);
    }

    .newschat-highlighted-text {
        background: linear-gradient(120deg, #a8edea 0%, #fed6e3 100%);
        padding: 0.5rem 1rem;
        border-radius: 8px;
        border: 2px solid #e0e0e0;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        position: relative;
        display: inline-block;
        font-weight: 500;
        color: #333;
        transition: all 0.3s ease;
    }

    .newschat-highlighted-text:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border-color: #007aff;
    }

    .newschat-magic-wand {
        position: absolute;
        top: -8px;
        right: -8px;
        font-size: 1.2rem;
        background: white;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        animation: sparkle 2s ease-in-out infinite;
    }

    @keyframes sparkle {
        0%, 100% { transform: scale(1) rotate(0deg); }
        50% { transform: scale(1.1) rotate(180deg); }
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

    .newschat-affiliate-disclaimer {
        font-size: 0.875rem;
        color: #888;
        text-align: center;
        margin-top: 1rem;
        padding: 0.5rem;
        background: #f8f9fa;
        border-radius: 6px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
`;

    class NewsChatAffiliateEmbed {
        constructor() {
            this.initialized = false;
            this.questionsLoaded = false;
            this.articleUrl = this.getArticleUrl();
            if (!this.articleUrl) {
                console.warn('NewsChat Affiliate: No article URL found');
                return;
            }
            this.init();
        }

        getArticleUrl() {
            const script = document.currentScript || document.querySelector('script[src*="embed_affiliate.js"]');
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
            if (document.getElementById('newschat-affiliate-styles')) return;
            const style = document.createElement('style');
            style.id = 'newschat-affiliate-styles';
            style.textContent = STYLES;
            document.head.appendChild(style);
        }

        createPopupContainer() {
            if (document.getElementById('newschat-affiliate-popup')) return;
            
            const popupOverlay = document.createElement('div');
            popupOverlay.id = 'newschat-affiliate-popup';
            popupOverlay.className = CONFIG.CSS_CLASSES.popupOverlay;
            
            const popupContent = document.createElement('div');
            popupContent.className = CONFIG.CSS_CLASSES.popupContent;
            
            const closeButton = document.createElement('button');
            closeButton.className = CONFIG.CSS_CLASSES.popupClose;
            closeButton.innerHTML = '×';
            closeButton.addEventListener('click', () => this.hidePopup());
            
            const title = document.createElement('h3');
            title.className = 'newschat-popup-title';
            title.textContent = '추천 콘텐츠';
            
            const description = document.createElement('p');
            description.className = 'newschat-popup-description';
            description.textContent = '아래의 콘텐츠를 확인하세요.';
            
            const linkContainer = document.createElement('div');
            linkContainer.id = 'newschat-affiliate-popup-link-container';
            
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

        showPopup(question) {
            const popup = document.getElementById('newschat-affiliate-popup');
            const linkContainer = document.getElementById('newschat-affiliate-popup-link-container');
            
            // Clear previous content
            linkContainer.innerHTML = '';
            
            // Display affiliate content
            linkContainer.innerHTML = `<div style="display: flex; justify-content: center;">${question.url}</div>`;

            const affiliateDisclaimer = document.createElement('p');
            affiliateDisclaimer.className = 'newschat-affiliate-disclaimer';
            affiliateDisclaimer.textContent = '쿠팡 파트너스 활동의 일환으로 수수료를 일부 제공 받습니다';
            linkContainer.appendChild(affiliateDisclaimer);
            
            // Show popup
            popup.classList.add('show');
            document.body.style.overflow = 'hidden';
        }

        hidePopup() {
            const popup = document.getElementById('newschat-affiliate-popup');
            popup.classList.remove('show');
            document.body.style.overflow = '';
        }

        isPopupVisible() {
            const popup = document.getElementById('newschat-affiliate-popup');
            return popup && popup.classList.contains('show');
        }

        async loadQuestions() {
            if (this.questionsLoaded) {
                console.log('NewsChat Affiliate: Questions already loaded.');
                return;
            }
            this.questionsLoaded = true;
            console.log('NewsChat Affiliate: Starting to load questions.');
            console.log(this.articleUrl);

            try {
                console.log('NewsChat Affiliate: Fetching questions from API.');
                const response = await fetch(`${CONFIG.API_BASE_URL}/generate_questions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: this.articleUrl })
                });

                if (!response.ok) {
                    console.error(`NewsChat Affiliate: Failed to fetch questions. HTTP ${response.status}`);
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();
                console.log('NewsChat Affiliate: Questions fetched successfully.');

                if (Array.isArray(data.questions) && data.questions.length > 0) {
                    // Filter only affiliate questions
                    const affiliateQuestions = data.questions.filter(q => q.affiliate);
                    console.log(`NewsChat Affiliate: Found ${affiliateQuestions.length} affiliate questions.`);
                    
                    if (affiliateQuestions.length > 0) {
                        this.highlightAffiliateText(affiliateQuestions);
                    } else {
                        console.log('NewsChat Affiliate: No affiliate questions found.');
                    }
                } else {
                    console.log('NewsChat Affiliate: No questions available.');
                }

            } catch (error) {
                console.error('NewsChat Affiliate: Error loading questions:', error);
            }
        }

        highlightAffiliateText(questions) {
            const paragraphsAndListItems = Array.from(document.querySelectorAll("p, li"));

            questions.forEach(q => {
                if (!q.insert_after_paragraph) return;

                for (const element of paragraphsAndListItems) {
                    if (element.textContent.includes(q.insert_after_paragraph)) {
                        console.log("NewsChat Affiliate: Highlighting text for:", q.insert_after_paragraph);
                        this.createHighlightedText(element, q);
                        break;
                    }
                }
            });
        }

        createHighlightedText(element, question) {
            // Create container
            const container = document.createElement('div');
            container.className = CONFIG.CSS_CLASSES.container;
            
            // Create highlighted text span
            const highlightedText = document.createElement('span');
            highlightedText.className = CONFIG.CSS_CLASSES.highlightedText;
            highlightedText.textContent = question.insert_after_paragraph;
            
            // Create magic wand emoji
            const magicWand = document.createElement('span');
            magicWand.className = CONFIG.CSS_CLASSES.magicWand;
            magicWand.textContent = '✨';
            
            // Add click event
            container.addEventListener('click', (e) => {
                e.preventDefault();
                this.showPopup(question);
            });
            
            // Assemble the elements
            container.appendChild(highlightedText);
            container.appendChild(magicWand);
            
            // Replace the text in the original element
            const originalText = element.textContent;
            const newText = originalText.replace(
                question.insert_after_paragraph,
                container.outerHTML
            );
            
            // Create a temporary container to parse the HTML
            const temp = document.createElement('div');
            temp.innerHTML = newText;
            
            // Replace the element's content
            element.innerHTML = temp.innerHTML;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new NewsChatAffiliateEmbed());
    } else {
        new NewsChatAffiliateEmbed();
    }
})(); 