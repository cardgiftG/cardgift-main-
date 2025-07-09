export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { cardData, previewImage, cardId } = req.body;
        
        console.log('📨 Получены данные карты:', cardId);
        
        // 🛡️ ВАЛИДАЦИЯ ДАННЫХ
        if (!cardId || !cardData) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['cardId', 'cardData']
            });
        }
        
        // 🎨 СОЗДАНИЕ ПРЕВЬЮ URL
        const baseUrl = `https://${req.headers.host}`;
        const cardViewUrl = `https://cardgift-main-cardgift-web3-k32una0f-cardgiftg.4everland.app/redirect.html?id=${cardId}`;
        
        // 📱 ПРЕВЬЮ ДЛЯ МЕССЕНДЖЕРОВ
        let previewUrl = cardViewUrl;
        if (previewImage && previewImage.length < 8000) { // Лимит URL
            previewUrl = `${baseUrl}/preview.html?id=${cardId}&img=${encodeURIComponent(previewImage)}`;
        }
        
        // 📊 ЛОГИРОВАНИЕ АНАЛИТИКИ
        console.log('✅ Карта обработана:', {
            cardId,
            userId: cardData.userId,
            style: cardData.style,
            hasImage: !!cardData.mediaUrl,
            hasVideo: !!cardData.videoUrl,
            timestamp: new Date().toISOString()
        });
        
        // 💾 СОХРАНЕНИЕ МЕТАДАННЫХ (опционально)
        try {
            // TODO: Сохранить в базу данных или файл
            // await saveCardMetadata(cardId, cardData);
        } catch (saveError) {
            console.warn('⚠️ Ошибка сохранения метаданных:', saveError);
        }
        
        // 🎯 ОТВЕТ КЛИЕНТУ
        return res.status(200).json({
            success: true,
            imageUrl: previewImage || `${baseUrl}/default-preview.jpg`,
            shareUrl: previewUrl,
            cardViewUrl: cardViewUrl,
            cardId: cardId,
            metadata: {
                title: extractTitle(cardData),
                description: extractDescription(cardData),
                createdAt: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('❌ Ошибка API:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Server error',
            cardId: req.body?.cardId || 'unknown'
        });
    }
}

// 🎨 ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
function extractTitle(cardData) {
    if (!cardData?.greeting) return 'Поздравительная открытка';
    
    const firstLine = cardData.greeting.split('\n')[0];
    return firstLine ? firstLine.substring(0, 60) : 'Поздравительная открытка';
}

function extractDescription(cardData) {
    if (!cardData?.greeting) return 'Красивая персональная открытка от CardGift';
    
    const lines = cardData.greeting.split('\n').filter(line => line.trim());
    const description = lines.slice(0, 2).join(' ');
    return description ? description.substring(0, 160) : 'Красивая персональная открытка от CardGift';
}

// 💾 ФУНКЦИЯ СОХРАНЕНИЯ (для будущего использования)
async function saveCardMetadata(cardId, cardData) {
    // TODO: Реализовать сохранение в базу данных
    // Например, в MongoDB, PostgreSQL или файловую систему
    const metadata = {
        cardId,
        userId: cardData.userId,
        greeting: cardData.greeting,
        style: cardData.style,
        createdAt: new Date().toISOString(),
        viewCount: 0
    };
    
    console.log('💾 Метаданные готовы к сохранению:', metadata);
    // await db.cards.insert(metadata);
}
