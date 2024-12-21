export class ParallaxBackground {
    constructor(scene) {
        this.scene = scene;
        this.layers = [];
        console.log('ParallaxBackground: Initializing...');
        this.setupLayers();
    }

    setupLayers() {
        const { width, height } = this.scene.scale;
        console.log('ParallaxBackground: Setting up layers with dimensions:', { width, height });

        // Create background layers with different scroll factors
        // The smaller the scrollFactor, the slower it moves
        const layers = [
            { key: 'bg-sky', scrollFactor: 0.0, scale: 1.2, y: 0 },         // Sky stays fixed
            { key: 'bg-mountains', scrollFactor: 0.05, scale: 0.8, y: height * 0.3 },   // Mountains very far back
            { key: 'bg-trees', scrollFactor: 0.15, scale: 0.9, y: height * 0.4 },       // Trees in middle distance
            { key: 'bg-ground', scrollFactor: 0.5, scale: 1.2, y: height * 0.7 }        // Ground in foreground
        ];

        layers.forEach(layer => {
            console.log('ParallaxBackground: Creating layer:', layer.key);
            // Create two instances of each layer for seamless scrolling
            for (let i = 0; i < 2; i++) {
                const image = this.scene.add.image(i * width, layer.y, layer.key);
                
                // Check if the image was created successfully
                if (!image.texture || image.texture.key === '__MISSING') {
                    console.error('ParallaxBackground: Failed to load texture for', layer.key);
                    return;
                }
                
                console.log('ParallaxBackground: Successfully created image for', layer.key, 'instance', i + 1);
                
                image.setOrigin(0, 0)
                    .setScrollFactor(layer.scrollFactor, 0)  // Only scroll horizontally
                    .setDepth(-5);  // Put background behind everything

                // Scale image to cover the screen width while maintaining aspect ratio
                const scaleX = (width / image.width) * layer.scale;
                const scaleY = (height / image.height) * layer.scale;
                const finalScale = Math.max(scaleX, scaleY);
                image.setScale(finalScale);
                
                console.log('ParallaxBackground: Layer scaling:', {
                    key: layer.key,
                    originalSize: { width: image.width, height: image.height },
                    scale: finalScale,
                    finalSize: { width: image.width * finalScale, height: image.height * finalScale }
                });

                this.layers.push({
                    image,
                    key: layer.key,
                    scrollFactor: layer.scrollFactor,
                    baseY: layer.y
                });
            }
        });
        
        console.log('ParallaxBackground: Setup complete with', this.layers.length, 'layer instances');
    }

    update() {
        const { width } = this.scene.scale;
        const cameraX = this.scene.cameras.main.scrollX;

        // Update each layer's position
        for (let i = 0; i < this.layers.length; i += 2) {
            const layer1 = this.layers[i].image;
            const layer2 = this.layers[i + 1].image;
            const scrollFactor = this.layers[i].scrollFactor;

            // Calculate the effective position based on camera scroll
            const effectiveScroll = cameraX * scrollFactor;

            // Position the two instances of the layer
            layer1.x = -effectiveScroll % width;
            layer2.x = layer1.x + width;

            // Keep the y position constant
            layer1.y = this.layers[i].baseY;
            layer2.y = this.layers[i].baseY;

            // If a layer has moved completely off screen, wrap it around
            if (layer1.x < -width) {
                layer1.x += width * 2;
            } else if (layer1.x > width) {
                layer1.x -= width * 2;
            }

            if (layer2.x < -width) {
                layer2.x += width * 2;
            } else if (layer2.x > width) {
                layer2.x -= width * 2;
            }
        }
    }
}
