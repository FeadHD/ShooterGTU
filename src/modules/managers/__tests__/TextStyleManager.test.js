import { TextStyleManager } from '../TextStyleManager';

describe('TextStyleManager', () => {
    let textStyleManager;
    let mockScene;

    beforeEach(() => {
        mockScene = {
            add: {
                text: jest.fn()
            }
        };
        textStyleManager = new TextStyleManager(mockScene);
    });

    describe('initialization', () => {
        it('should create styles object with all required styles', () => {
            expect(textStyleManager.styles).toBeDefined();
            expect(textStyleManager.styles.score).toBeDefined();
            expect(textStyleManager.styles.lives).toBeDefined();
            expect(textStyleManager.styles.hp).toBeDefined();
            expect(textStyleManager.styles.timer).toBeDefined();
            expect(textStyleManager.styles.bitcoin).toBeDefined();
            expect(textStyleManager.styles.fps).toBeDefined();
            expect(textStyleManager.styles.wallet).toBeDefined();
        });

        it('should apply base retro style to all text styles', () => {
            const baseRetro = TextStyleManager.baseStyles.retro;
            Object.values(textStyleManager.styles).forEach(style => {
                expect(style.fontFamily).toBe(baseRetro.fontFamily);
                expect(style.align).toBe(baseRetro.align);
                expect(style.stroke).toBe(baseRetro.stroke);
                expect(style.strokeThickness).toBe(baseRetro.strokeThickness);
            });
        });

        it('should apply correct colors from color scheme', () => {
            expect(textStyleManager.styles.score.fill).toBe(TextStyleManager.colors.score);
            expect(textStyleManager.styles.lives.fill).toBe(TextStyleManager.colors.lives);
            expect(textStyleManager.styles.hp.fill).toBe(TextStyleManager.colors.hp);
            expect(textStyleManager.styles.timer.fill).toBe(TextStyleManager.colors.timer);
            expect(textStyleManager.styles.bitcoin.fill).toBe(TextStyleManager.colors.bitcoin);
            expect(textStyleManager.styles.fps.fill).toBe(TextStyleManager.colors.neutral);
            expect(textStyleManager.styles.wallet.fill).toBe(TextStyleManager.colors.bitcoin);
        });
    });

    describe('static properties', () => {
        it('should have baseStyles defined', () => {
            expect(TextStyleManager.baseStyles).toBeDefined();
            expect(TextStyleManager.baseStyles.retro).toBeDefined();
            expect(TextStyleManager.baseStyles.arcade).toBeDefined();
        });

        it('should have shadowEffects defined', () => {
            expect(TextStyleManager.shadowEffects).toBeDefined();
            expect(TextStyleManager.shadowEffects.neon).toBeDefined();
            expect(TextStyleManager.shadowEffects.subtle).toBeDefined();
        });

        it('should have colors defined', () => {
            expect(TextStyleManager.colors).toBeDefined();
            expect(TextStyleManager.colors.primary).toBeDefined();
            expect(TextStyleManager.colors.secondary).toBeDefined();
            expect(TextStyleManager.colors.score).toBeDefined();
            expect(TextStyleManager.colors.lives).toBeDefined();
            expect(TextStyleManager.colors.hp).toBeDefined();
            expect(TextStyleManager.colors.bitcoin).toBeDefined();
            expect(TextStyleManager.colors.timer).toBeDefined();
        });
    });
});
