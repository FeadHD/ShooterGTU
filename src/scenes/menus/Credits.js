import { Scene } from 'phaser';

export class Credits extends Scene {
    constructor() {
        super({ key: 'Credits' });
        this.creditsText = [
            'SHOOTER GTU',
            '',
            'A GTU ENTERTAINMENT PRODUCTION',
            '',
            'In Association With',
            'Caffeine Overdose Studios',
            'Sleep Deprivation Entertainment',
            'Deadline? What Deadline? Productions',
            '',
            'Executive Producer',
            'FEAD',
            '',
            'Creative Director',
            'Fead',
            '(No relation to the Executive Producer,',
            'they just have similar names)',
            '',
            'Technical Director',
            'JunKys',
            '(The one who actually knows how computers work)',
            '',
            'Senior Production Team',
            'Gray - Chief Bug Creator',
            'JunKys - Master of Disaster Recovery',
            '',
            'Game Director',
            'Fead',
            '(Still no relation to the Executive Producer)',
            '',
            'Art Director',
            'JunKys',
            '(Also handles pixel-perfect alignment of console.log statements)',
            '',
            'Advanced Graphics Engineering',
            'Gray - Principal Engineer of Making Things Shiny',
            'FeadHD - Shader Specialist (and part-time pixel whisperer)',
            'JunKys - VFX Programming (Explosions go boom)',
            '',
            'Gameplay Systems Architecture',
            'JunKys - Lead Architect of Spaghetti Code',
            'Gray - Systems Designer (Professional Stack Overflow Navigator)',
            'Fead - Core Mechanics (Certified Bug Habitat Designer)',
            '',
            'Combat Design Specialists',
            'JunKys - Melee Systems (Button Masher Extraordinaire)',
            'Fead - Weapon Balance (Nerfing Things Since 2024)',
            'Gray - Enemy AI (Teaching NPCs to be less artificial and more intelligent)',
            '',
            'Environmental Art Team',
            'JunKys - Lead Artist (Professional Tree Painter)',
            'Gray - Level Artist (Specialized in Placing Rocks)',
            'JunKys - Prop Artist (Master of Creating Things Players Break)',
            '',
            'Character Animation Squad',
            'Fead - Animation Director (Makes Things Move Good)',
            'Gray - Technical Animator (Fixes Things That Move Bad)',
            '',
            'Narrative Design & Writing',
            'JunKys - Lead Writer (Professional Plot Hole Filler)',
            'JunKys - Dialogue Writer (Semicolon Enthusiast)',
            '',
            'Performance Optimization',
            'Gray - Lead Optimizer (Can make any code run at 2 FPS)',
            'Fead - Memory Management (Professional RAM Whisperer)',
            '',
            'Platform Integration',
            'JunKys - Cross-Platform Lead (Makes Square Pegs Fit Round Holes)',
            'JunKys - Console Specialist (Knows Where All The Buttons Are)',
            '',
            'Build Engineering',
            'Gray - Build Master (Professional "Works On My Machine" Engineer)',
            'Fead - Pipeline Tools (Plumber of the Code Rivers)',
            '',
            'DevOps & Infrastructure',
            'JunKys - CI/CD Lead (Continuous Chaos/Disaster)',
            'JunKys - Cloud Architecture (Head of Meteorology Department)',
            '',
            'Quality Assurance',
            'Lead QA',
            'Gray (Found 99 bugs in the code, took one down, patched it around...)',
            '',
            'QA Team Leads',
            'Fead - Gameplay Testing (Professional Game Breaker)',
            'JunKys - Performance Testing (Crash Test Dummy)',
            'JunKys - Platform Compatibility (Works in 60% of cases, every time)',
            '',
            'Player Experience Research',
            'Gray - Research Lead (Studies Why Players Keep Dying)',
            'Fead - Data Analysis (Counts Deaths Per Second)',
            '',
            'UI/UX Design Team',
            'JunKys - UI Lead (Button Alignment Specialist)',
            'JunKys - UX Specialist (Makes Clicking Things Feel Clicky)',
            '',
            'Audio Production',
            '',
            'Audio Director',
            'Gray (Master of Pew Pew Sounds)',
            '',
            'Sound Design',
            'Fead - Weapon Effects (Professional Boom Maker)',
            'JunKys - Environmental (Recorded actual keyboard typing for authenticity)',
            '',
            'Music Composition',
            'JunKys - Lead Composer (Mostly Elevator Music)',
            'Gray - Additional Music (Humming in the Background)',
            '',
            'Voice Acting Director',
            'Fead (Chief Microphone Tester)',
            '',
            'Voice Talent',
            'Gray as "The Hero" (Recorded All Lines During Meetings)',
            'Fead as "The Villain" (Method Actor, Actually Became Evil)',
            'JunKys as "The Mentor" (Actual Debugging Sessions Recorded)',
            'JunKys as "The Mysterious Stranger" (Just Some Guy We Found)',
            '',
            'Motion Capture Studio',
            'Gray - Mocap Director (Professional Dance Move Copier)',
            'Fead - Technical Director (Puts Dots On People)',
            'JunKys - Animation Clean-up (Digital Janitor)',
            '',
            'Localization Teams',
            '',
            'French Team',
            'JunKys - Lead (Omelette du Fromage Department)',
            '',
            'Japanese Team',
            'JunKys - Lead (Studied Anime for Research)',
            '',
            'Marketing & PR',
            '',
            'Global Marketing Director',
            'Gray (Professional Hype Generator)',
            '',
            'Regional Marketing',
            'Fead - North America (Knows All 50 States... Almost)',
            'JunKys - Europe (Can Point to France on a Map)',
            'JunKys - Asia (Has Eaten Authentic Instant Ramen)',
            '',
            'Social Media Team',
            'Gray - Strategy (Professional Tweet Deleter)',
            'Fead - Content (Meme Archaeologist)',
            '',
            'Community Management',
            'JunKys - Lead CM (Professional Drama Diffuser)',
            'JunKys - Forum Moderator (Survived The Flame Wars)',
            '',
            'Player Support',
            'Gray - Support Lead (Professional "Have You Tried Turning It Off And On Again?" Specialist)',
            'Fead - Technical Support (Can Read Error Logs... Sometimes)',
            '',
            'Legal Team',
            'Gray & Associates',
            '(We watched Better Call Saul)',
            '',
            'Business Development',
            'Fead Ventures',
            '(We have a piggy bank)',
            '',
            'Special Thanks',
            'Phaser Game Framework Team (The Real MVPs)',
            'The Open Source Community (Free Stuff Rules)',
            'Stack Overflow Contributors (Our Real Teachers)',
            'Coffee Makers Worldwide (The True Heroes)',
            'Energy Drink Suppliers (Our Legal Drug Dealers)',
            'Local Pizza Delivery (The Real Project Managers)',
            'Understanding Family Members (We\'ll See Them Again Someday)',
            'Patient Significant Others (We Promise To Remember Their Names)',
            '',
            'Extra Special Thanks',
            'The Bugs That Kept Us Employed',
            'The Rubber Duck That Never Judged',
            'That One Stack Overflow Answer from 2014',
            'Ctrl+Z (The Real MVP)',
            'Copy & Paste (The Other Real MVP)',
            'The Developer Who Wrote Comments (Both of Them)',
            'Git Blame (For Helping Us Know Who to Blame)',
            'The Intern Who Brought Cookies',
            '',
            'In Memory Of',
            'All the deleted print statements',
            'Every git stash we forgot about',
            'That one backup folder named "final_final_FINAL_v2"',
            'The original project timeline',
            '',
            '"No keyboards were harmed in the making of this game',
            '(well, maybe just a few)',
            'OK, we went through about 47 keyboards',
            'But they died for a noble cause"',
            '',
            '"Any resemblance to actual AAA games is purely coincidental',
            'and honestly quite surprising',
            'seriously, we\'re as surprised as you are"',
            '',
            'Fun Facts:',
            '- This game contains exactly 42 hidden features',
            '  (we\'re still finding some of them)',
            '- There are 7 secret endings',
            '  (we only planned for 2)',
            '- The code includes 1,287,394 lines of console.log()',
            '  (we meant to remove those)',
            '',
            'GTU Entertainment 2025',
            'All your base are belong to us',
            '(yes, we\'re still using that meme)',
            '',
            'Post-Credits Scene',
            '(Just Kidding)',
            '(Or are we?)',
            '(No, we\'re not)',
            '(Unless...?)',
            '',
            'Seriously though, thanks for playing!',
            '',
            'Error 418: I\'m a teapot',
            '(If you get this reference, you spend too much time coding)',
            '',
            'The End',
            '(For Real This Time)',
            '(No More Scrolling)',
            '(Why Are You Still Here?)',
            '(The Game Is Done)',
            '(Go Home)',
            '(Fine, Have a Cookie 🍪)',
            '',
            '',
            'Press ESC to return to Main Menu',
            '(You probably should have done that 5 minutes ago)'
        ];
        this.scrollSpeed = 1.5;
    }

    create() {
        this.cameras.main.setBackgroundColor('#000000');
        
        // Calculate total height needed for credits
        const lineHeight = 40;
        const totalHeight = this.creditsText.length * lineHeight;
        
        // Create a container for all credit texts
        this.creditsContainer = this.add.container(0, this.cameras.main.height);
        
        // Add each line of credits
        this.creditsText.forEach((line, index) => {
            const yPosition = index * lineHeight;
            const style = {
                fontFamily: 'Retronoid, Arial',
                fontSize: this.getTextSize(line),
                color: this.getTextColor(line),
                align: 'center',
                stroke: '#000000',
                strokeThickness: 2
            };
            
            const textObject = this.add.text(
                this.cameras.main.centerX, 
                yPosition,
                line,
                style
            ).setOrigin(0.5);
            
            this.creditsContainer.add(textObject);
        });

        // Add ESC key handler
        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.start('MainMenu');
        });

        // Add skip text at the bottom
        this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.height - 40,
            'Press ESC to skip',
            {
                fontFamily: 'Retronoid, Arial',
                fontSize: '24px',
                color: '#666666',
                align: 'center'
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(1);

        // Store initial position for proper scrolling
        this.initialY = this.cameras.main.height;
        this.maxScroll = -(totalHeight + this.cameras.main.height); // Add screen height to ensure scrolling all the way
    }

    update() {
        if (this.creditsContainer.y > this.maxScroll) {
            this.creditsContainer.y -= this.scrollSpeed;
        } else {
            // Reset position when credits finish
            this.creditsContainer.y = this.initialY;
        }
    }

    getTextSize(line) {
        if (line === 'SHOOTER GTU') return '72px';
        if (line === 'A GTU ENTERTAINMENT PRODUCTION') return '48px';
        if (line === '') return '24px';
        if (line.includes('Press ESC')) return '24px';
        if (line.startsWith('"')) return '28px';
        if (line.includes('Error 418')) return '36px';
        if (line.startsWith('Fun Facts')) return '36px';
        // Section headers (lines followed by empty line and names)
        if (this.creditsText[this.creditsText.indexOf(line) + 1] === '') return '36px';
        return '28px';
    }

    getTextColor(line) {
        if (line === 'SHOOTER GTU') return '#00ffff';
        if (line === 'A GTU ENTERTAINMENT PRODUCTION') return '#ff00ff';
        if (line === '') return '#ffffff';
        if (line.includes('Press ESC')) return '#666666';
        if (line.startsWith('"')) return '#00ff00';
        if (line.includes('Error 418')) return '#ff0000';
        if (line.startsWith('Fun Facts')) return '#ffff00';
        if (line.includes('🍪')) return '#ffaa00';
        // Section headers
        if (this.creditsText[this.creditsText.indexOf(line) + 1] === '') return '#00ffff';
        return '#ffffff';
    }
}
