function parsePage() {
    // вспомогательные функции
    const getElement = (selector, parent = document) => parent.querySelector(selector);
    

    const getAllElements = (selector, parent = document) => [...parent.querySelectorAll(selector)];
    

    const cleanText = (element) => element?.textContent?.trim() || '';
    
    // язык страницы
    const language = document.documentElement.lang || '';
    
    // мета название сайта
    const fullTitle = document.title;
    const titleParts = fullTitle.split('—');
    const pageTitle = titleParts[0].trim();
    
    // мета ключевые слова
    const keywordsMeta = getElement('meta[name="keywords"]');
    const keywords = keywordsMeta?.getAttribute('content')?.split(',').map(k => k.trim()) || [];
    
    // мета описание
    const descriptionMeta = getElement('meta[name="description"]');
    const metaDescription = descriptionMeta?.getAttribute('content') || '';
    
    // опенграф
    const ogTags = getAllElements('meta[property^="og:"]');
    const opengraph = {};
    ogTags.forEach(tag => {
        const property = tag.getAttribute('property');
        const key = property.substring(3); // Remove 'og:' prefix
        opengraph[key] = tag.getAttribute('content') || '';
    });
    
    // Айди продукта
    const productSection = getElement('.product');
    const productId = productSection?.getAttribute('data-id') || '';
    
    // Массив изобращений
    const mainImage = getElement('.preview figure img');
    const thumbnailButtons = getAllElements('.preview nav button');
    
    const images = [];
    

    if (mainImage) {
        images.push({
            full: mainImage.src || '',
            thumbnail: mainImage.src || '',
            alt: mainImage.alt || ''
        });
    }
    

    thumbnailButtons.forEach(button => {
        const thumbImg = getElement('img', button);
        if (thumbImg) {
            const fullImageUrl = thumbImg.getAttribute('data-src') || thumbImg.src || '';
            const thumbnailUrl = thumbImg.src || '';
            const altText = thumbImg.alt || '';
            

            const isDuplicate = images.some(img => img.full === fullImageUrl);
            if (!isDuplicate && fullImageUrl) {
                images.push({
                    full: fullImageUrl,
                    thumbnail: thumbnailUrl,
                    alt: altText
                });
            }
        }
    });
    
    // статус лайка
    const likeButton = getElement('.like');
    const isLiked = likeButton?.classList.contains('active') || false;
    
    // Наименование товара
    const h1Element = getElement('.about h1');
    const productTitle = cleanText(h1Element);
    

    const tagsContainer = getElement('.tags');
    const tagElements = getAllElements('span', tagsContainer);
    
    const categories = [];
    const badges = [];
    const discounts = [];
    
    tagElements.forEach(tag => {
        const tagText = cleanText(tag);
        if (tag.classList.contains('green')) {
            categories.push(tagText);
        } else if (tag.classList.contains('blue')) {
            badges.push(tagText);
        } else if (tag.classList.contains('red')) {
            discounts.push(tagText);
        }
    });
    
    // цена товара
    const priceContainer = getElement('.price');
    let priceWithDiscount = 0;
    let priceWithoutDiscount = 0;
    let currency = '';
    
    if (priceContainer) {
        const priceText = cleanText(priceContainer);
        const priceMatch = priceText.match(/([$€₽])(\d+)/);
        if (priceMatch) {
            currency = priceMatch[1];
            priceWithDiscount = parseInt(priceMatch[2], 10);
        }
        
        const oldPriceSpan = getElement('span', priceContainer);
        if (oldPriceSpan) {
            const oldPriceText = cleanText(oldPriceSpan);
            const oldPriceMatch = oldPriceText.match(/([$€₽])(\d+)/);
            if (oldPriceMatch) {
                priceWithoutDiscount = parseInt(oldPriceMatch[2], 10);
            }
        }
    }
    

    let discountPercent = 0;
    if (priceWithoutDiscount > 0 && priceWithDiscount > 0) {
        discountPercent = Math.round(((priceWithoutDiscount - priceWithDiscount) / priceWithoutDiscount) * 100);
    }
    

    const currencyMap = {
        '$': 'USD',
        '€': 'EUR',
        '₽': 'RUB'
    };
    const currencyCode = currencyMap[currency] || '';
    
    // свойства
    const propertiesList = getElement('.properties');
    const propertyItems = getAllElements('li', propertiesList);
    const properties = {};
    
    propertyItems.forEach(item => {
        const spans = getAllElements('span', item);
        if (spans.length >= 2) {
            const key = cleanText(spans[0]);
            const value = cleanText(spans[1]);
            properties[key] = value;
        }
    });
    
    // описание
    const descriptionContainer = getElement('.description');
    let fullDescription = '';
    
    if (descriptionContainer) {

        const clone = descriptionContainer.cloneNode(true);
        

        const unusedHeader = getElement('h3', clone);
        if (unusedHeader && unusedHeader.classList.contains('unused')) {
            unusedHeader.remove();
        }
        

        const allElements = clone.querySelectorAll('*');
        allElements.forEach(el => {
            const attributes = [...el.attributes]; // преобразует псевдомассив в обычный
            attributes.forEach(attr => {
                if (attr.name !== 'href' && attr.name !== 'src') {
                    el.removeAttribute(attr.name);
                }
            });
        });
        
        fullDescription = clone.innerHTML;
    }
    
    // предложения
    const suggestedProducts = [];
    const suggestedArticles = getAllElements('.suggested .items article');
    
    suggestedArticles.forEach(article => {
        const img = getElement('img', article);
        const titleElement = getElement('h3', article);
        const priceElement = getElement('b', article);
        const descElement = getElement('p', article);
        
        const priceText = cleanText(priceElement);
        const priceMatch = priceText.match(/([$€₽])(\d+)/);
        let price = 0;
        let productCurrency = '';
        
        if (priceMatch) {
            productCurrency = currencyMap[priceMatch[1]] || '';
            price = parseInt(priceMatch[2], 10);
        }
        
        suggestedProducts.push({
            image: img?.src || '',
            title: cleanText(titleElement),
            price: price,
            currency: productCurrency,
            description: cleanText(descElement)
        });
    });
    
    // отзывы
    const reviews = [];
    const reviewArticles = getAllElements('.reviews .items article');
    
    reviewArticles.forEach(article => {
        const stars = getAllElements('.rating span', article);
        const rating = stars.filter(star => star.classList.contains('filled')).length;
        
        const titleElement = getElement('.title', article);
        const descElement = getElement('p', article);
        const authorDiv = getElement('.author', article);
        
        let avatar = '';
        let authorName = '';
        let date = '';
        
        if (authorDiv) {
            const avatarImg = getElement('img', authorDiv);
            avatar = avatarImg?.src || '';
            
            const spans = getAllElements('span', authorDiv);
            authorName = spans.length > 0 ? cleanText(spans[0]) : '';
            
            const italicElement = getElement('i', authorDiv);
            date = italicElement ? cleanText(italicElement) : '';
        }
        
        // форматируем дату
        let formattedDate = date;
        if (date && date.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
            const [day, month, year] = date.split('/');
            formattedDate = `${day}.${month}.${year}`;
        }
        
        reviews.push({
            rating: rating,
            title: cleanText(titleElement),
            description: cleanText(descElement),
            author: {
                avatar: avatar,
                name: authorName
            },
            date: formattedDate
        });
    });
    

    return {
        meta: {
            language,
            title: pageTitle,
            keywords,
            description: metaDescription,
            opengraph
        },
        product: {
            id: productId,
            images: images,
            isLiked: isLiked,
            title: productTitle,
            categories: categories,
            badges: badges,
            discounts: discounts,
            priceWithDiscount: priceWithDiscount,
            priceWithoutDiscount: priceWithoutDiscount,
            discountPercent: discountPercent,
            currency: currencyCode,
            properties: properties,
            description: fullDescription
        },
        suggested: suggestedProducts,
        reviews: reviews
    };
}

window.parsePage = parsePage;