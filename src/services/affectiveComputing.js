/**
 * Affective Computing Service - Emotional AI
 * 
 * PREMIUM FEATURE #23: Affective Computing
 * 
 * AI that detects feelings, not just words.
 * Provides "Psychological X-Ray" of suppliers before negotiation.
 * 
 * @module affectiveComputing
 */

const EmotionType = Object.freeze({
    NEUTRAL: 'neutral', POSITIVE: 'positive', NEGATIVE: 'negative',
    ANXIOUS: 'anxious', CONFIDENT: 'confident', FRUSTRATED: 'frustrated',
    DESPERATE: 'desperate', ARROGANT: 'arrogant', COOPERATIVE: 'cooperative',
    HESITANT: 'hesitant', URGENT: 'urgent', DISMISSIVE: 'dismissive'
});

const NegotiationPosture = Object.freeze({
    AGGRESSIVE: 'aggressive', DEFENSIVE: 'defensive', COLLABORATIVE: 'collaborative',
    AVOIDANT: 'avoidant', COMPROMISING: 'compromising'
});

const emotionPatterns = {
    [EmotionType.DESPERATE]: {
        keywords: ['urgente', 'preciso', 'por favor', 'ajuda', 'imediato', 'crítico', 'emergência', 'última chance'],
        phrases: ['não posso perder', 'preciso fechar', 'qualquer coisa', 'faço um esforço'],
        punctuation: ['!!!', '???', '...'],
        weight: 0.9
    },
    [EmotionType.ARROGANT]: {
        keywords: ['melhor preço', 'impossível', 'não baixo', 'pegar ou largar', 'único fornecedor'],
        phrases: ['vocês que sabem', 'se não quiser', 'não preciso', 'tenho outros clientes'],
        punctuation: ['.'],
        weight: 0.85
    },
    [EmotionType.ANXIOUS]: {
        keywords: ['preocupado', 'incerto', 'talvez', 'não sei', 'difícil', 'complicado'],
        phrases: ['vou verificar', 'deixa eu ver', 'não tenho certeza', 'pode ser que'],
        punctuation: ['...', '?'],
        weight: 0.7
    },
    [EmotionType.CONFIDENT]: {
        keywords: ['certeza', 'garantido', 'confiável', 'sempre', 'excelente', 'perfeito'],
        phrases: ['pode contar', 'sem problema', 'fazemos isso', 'não se preocupe'],
        punctuation: ['!', '.'],
        weight: 0.75
    },
    [EmotionType.COOPERATIVE]: {
        keywords: ['parceria', 'juntos', 'acordo', 'flexível', 'negociável', 'entendo'],
        phrases: ['vamos encontrar', 'podemos conversar', 'o que acha', 'para você'],
        punctuation: ['!', '?'],
        weight: 0.8
    },
    [EmotionType.URGENT]: {
        keywords: ['hoje', 'agora', 'rápido', 'prazo', 'deadline', 'amanhã', 'imediato'],
        phrases: ['precisa ser', 'não dá para esperar', 'tem que sair'],
        punctuation: ['!', '!!'],
        weight: 0.6
    }
};

class EmotionAnalysis {
    constructor(text, results) {
        this.text = text;
        this.emotions = results.emotions;
        this.dominantEmotion = results.dominant;
        this.confidence = results.confidence;
        this.posture = results.posture;
        this.negotiationAdvice = results.advice;
        this.timestamp = Date.now();
    }
}

class AffectiveComputingService {
    constructor() {
        this.analysisHistory = [];
        this.metrics = { totalAnalyses: 0, avgConfidence: 0, emotionCounts: {} };
        this.confidences = [];
    }

    analyzeText(text) {
        if (!text || text.trim().length === 0) {
            return new EmotionAnalysis(text, {
                emotions: {}, dominant: EmotionType.NEUTRAL,
                confidence: 0, posture: NegotiationPosture.AVOIDANT, advice: []
            });
        }

        const normalizedText = text.toLowerCase();
        const emotionScores = this.calculateEmotionScores(normalizedText);
        const dominant = this.findDominantEmotion(emotionScores);
        const confidence = this.calculateConfidence(emotionScores, text);
        const posture = this.inferNegotiationPosture(emotionScores, dominant);
        const advice = this.generateNegotiationAdvice(dominant, emotionScores, posture);

        const result = new EmotionAnalysis(text, {
            emotions: emotionScores,
            dominant,
            confidence,
            posture,
            advice
        });

        this.recordAnalysis(result);
        return result;
    }

    calculateEmotionScores(text) {
        const scores = {};

        for (const [emotion, patterns] of Object.entries(emotionPatterns)) {
            let score = 0;
            let matches = 0;

            // Check keywords
            for (const keyword of patterns.keywords) {
                if (text.includes(keyword)) {
                    score += 0.2;
                    matches++;
                }
            }

            // Check phrases
            for (const phrase of patterns.phrases) {
                if (text.includes(phrase)) {
                    score += 0.4;
                    matches++;
                }
            }

            // Check punctuation patterns
            for (const punct of patterns.punctuation) {
                const count = (text.match(new RegExp(punct.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
                score += count * 0.05;
            }

            // Apply weight
            score *= patterns.weight;

            if (score > 0) {
                scores[emotion] = Math.min(score, 1);
            }
        }

        // Analyze sentence structure
        const sentenceAnalysis = this.analyzeSentenceStructure(text);

        if (sentenceAnalysis.shortSentences > 0.6) {
            scores[EmotionType.URGENT] = (scores[EmotionType.URGENT] || 0) + 0.2;
        }
        if (sentenceAnalysis.questionRatio > 0.3) {
            scores[EmotionType.HESITANT] = (scores[EmotionType.HESITANT] || 0) + 0.15;
        }

        return scores;
    }

    analyzeSentenceStructure(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const avgLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
        const questions = (text.match(/\?/g) || []).length;

        return {
            sentenceCount: sentences.length,
            avgLength,
            shortSentences: sentences.filter(s => s.length < 30).length / sentences.length,
            questionRatio: questions / Math.max(sentences.length, 1)
        };
    }

    findDominantEmotion(scores) {
        if (Object.keys(scores).length === 0) return EmotionType.NEUTRAL;

        let maxScore = 0;
        let dominant = EmotionType.NEUTRAL;

        for (const [emotion, score] of Object.entries(scores)) {
            if (score > maxScore) {
                maxScore = score;
                dominant = emotion;
            }
        }

        return dominant;
    }

    calculateConfidence(scores, text) {
        const scoreValues = Object.values(scores);
        if (scoreValues.length === 0) return 0.3;

        const maxScore = Math.max(...scoreValues);
        const avgScore = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length;
        const textLength = text.length;

        // Confidence increases with text length and score differentiation
        let confidence = maxScore * 0.5 + (maxScore - avgScore) * 0.3;
        if (textLength > 200) confidence += 0.1;
        if (textLength > 500) confidence += 0.1;

        return Math.min(Math.max(confidence, 0.3), 0.95);
    }

    inferNegotiationPosture(scores, dominant) {
        if (dominant === EmotionType.DESPERATE || dominant === EmotionType.ANXIOUS) {
            return NegotiationPosture.DEFENSIVE;
        }
        if (dominant === EmotionType.ARROGANT || dominant === EmotionType.DISMISSIVE) {
            return NegotiationPosture.AGGRESSIVE;
        }
        if (dominant === EmotionType.COOPERATIVE || scores[EmotionType.COOPERATIVE] > 0.3) {
            return NegotiationPosture.COLLABORATIVE;
        }
        if (dominant === EmotionType.HESITANT) {
            return NegotiationPosture.AVOIDANT;
        }
        return NegotiationPosture.COMPROMISING;
    }

    generateNegotiationAdvice(dominant, scores, posture) {
        const advice = [];

        switch (dominant) {
            case EmotionType.DESPERATE:
                advice.push({
                    type: 'opportunity',
                    message: '💡 Fornecedor parece ansioso para fechar. Pode pedir 10-15% de desconto.',
                    confidence: 'high'
                });
                advice.push({
                    type: 'tactic',
                    message: '🎯 Tática: "Entendo a urgência, mas preciso de condições melhores para aprovar hoje."'
                });
                break;

            case EmotionType.ARROGANT:
                advice.push({
                    type: 'warning',
                    message: '⚠️ Fornecedor em posição de força. Evite pressionar demais.',
                    confidence: 'high'
                });
                advice.push({
                    type: 'tactic',
                    message: '🎯 Tática: Mostre alternativas reais. "Tenho outra cotação de R$X..."'
                });
                break;

            case EmotionType.ANXIOUS:
                advice.push({
                    type: 'insight',
                    message: '🔍 Fornecedor inseguro. Pode estar com problemas internos ou novato.',
                    confidence: 'medium'
                });
                advice.push({
                    type: 'tactic',
                    message: '🎯 Tática: Ofereça segurança em troca de melhor preço. "Posso garantir pedidos mensais se..."'
                });
                break;

            case EmotionType.COOPERATIVE:
                advice.push({
                    type: 'opportunity',
                    message: '✅ Fornecedor aberto a negociar. Bom momento para parceria de longo prazo.',
                    confidence: 'high'
                });
                advice.push({
                    type: 'tactic',
                    message: '🎯 Tática: Proponha volume em troca de desconto progressivo.'
                });
                break;

            case EmotionType.URGENT:
                advice.push({
                    type: 'warning',
                    message: '⏰ Urgência detectada. Cuidado com decisões precipitadas.',
                    confidence: 'medium'
                });
                break;

            default:
                advice.push({
                    type: 'info',
                    message: '📊 Tom neutro. Abordagem padrão recomendada.',
                    confidence: 'low'
                });
        }

        // Add posture-based advice
        if (posture === NegotiationPosture.DEFENSIVE && dominant !== EmotionType.DESPERATE) {
            advice.push({
                type: 'insight',
                message: '🛡️ Postura defensiva. Construa rapport antes de pedir concessões.'
            });
        }

        return advice;
    }

    analyzeEmail(email) {
        const fullText = `${email.subject || ''} ${email.body || ''}`;
        const analysis = this.analyzeText(fullText);

        // Add email-specific insights
        const responseTime = email.responseTimeMinutes;
        if (responseTime !== undefined) {
            if (responseTime < 30) {
                analysis.negotiationAdvice.push({
                    type: 'insight',
                    message: '⚡ Resposta rápida indica interesse alto ou ansiedade.'
                });
            } else if (responseTime > 1440) { // > 24h
                analysis.negotiationAdvice.push({
                    type: 'warning',
                    message: '🐢 Resposta lenta pode indicar baixo interesse ou sobrecarga.'
                });
            }
        }

        return analysis;
    }

    recordAnalysis(analysis) {
        this.analysisHistory.push(analysis);
        if (this.analysisHistory.length > 100) this.analysisHistory.shift();

        this.metrics.totalAnalyses++;
        this.confidences.push(analysis.confidence);
        if (this.confidences.length > 100) this.confidences.shift();
        this.metrics.avgConfidence = this.confidences.reduce((a, b) => a + b, 0) / this.confidences.length;

        const emotion = analysis.dominantEmotion;
        this.metrics.emotionCounts[emotion] = (this.metrics.emotionCounts[emotion] || 0) + 1;
    }

    getSupplierProfile(supplierId, analyses) {
        if (!analyses || analyses.length === 0) return null;

        const emotionCounts = {};
        let totalConfidence = 0;

        for (const analysis of analyses) {
            emotionCounts[analysis.dominantEmotion] = (emotionCounts[analysis.dominantEmotion] || 0) + 1;
            totalConfidence += analysis.confidence;
        }

        const dominantPattern = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0];

        return {
            supplierId,
            analysisCount: analyses.length,
            dominantEmotionalPattern: dominantPattern[0],
            patternFrequency: (dominantPattern[1] / analyses.length * 100).toFixed(0) + '%',
            avgConfidence: (totalConfidence / analyses.length).toFixed(2),
            recommendation: this.getSupplierRecommendation(dominantPattern[0])
        };
    }

    getSupplierRecommendation(pattern) {
        const recommendations = {
            [EmotionType.COOPERATIVE]: 'Priorizar para parcerias de longo prazo',
            [EmotionType.DESPERATE]: 'Oportunidade de negociação agressiva',
            [EmotionType.ARROGANT]: 'Manter alternativas sempre disponíveis',
            [EmotionType.ANXIOUS]: 'Oferecer estabilidade em troca de preços',
            [EmotionType.CONFIDENT]: 'Fornecedor confiável, negociar volume'
        };
        return recommendations[pattern] || 'Monitorar comportamento';
    }

    getMetrics() {
        return this.metrics;
    }
}

export const affectiveComputing = new AffectiveComputingService();
export { EmotionType, NegotiationPosture, EmotionAnalysis, AffectiveComputingService };
export default affectiveComputing;
