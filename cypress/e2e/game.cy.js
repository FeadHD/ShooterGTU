describe('Game E2E Tests', () => {
    beforeEach(() => {
        cy.visit('http://localhost:8080'); // Adjust URL to match your dev server
    });

    it('should load the game', () => {
        // Wait for Phaser canvas to be present
        cy.get('canvas').should('be.visible');
    });

    // Add more E2E tests based on your game features
    // For example:
    it('should respond to player input', () => {
        cy.get('canvas')
            .trigger('keydown', { key: 'ArrowRight' })
            .trigger('keyup', { key: 'ArrowRight' });
        // Add assertions based on expected behavior
    });
});
