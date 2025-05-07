
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				category: {
					poem: '#845EC2',
					story: '#FF6F91',
					technology: '#00C2A8',
					economics: '#00D2FC',
					travel: '#F9F871',
					lifestyle: '#B39CD0',
					fashion: '#FF9671',
					loket: '#FFC75F',
					his: '#008F7A',
				},
				mood: {
					sad: {
						light: '#D3E4FD',
						dark: '#222A3A'
					},
					joyful: {
						light: '#FEF7CD',
						dark: '#3A3422'
					},
					suspenseful: {
						light: '#FFE5E5',
						dark: '#321919'
					}
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' },
				},
				'fade-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' },
				},
				'fade-out': {
					'0%': { opacity: '1' },
					'100%': { opacity: '0' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'fade-out': 'fade-out 0.3s ease-out',
			},
			typography: {
				DEFAULT: {
					css: {
						maxWidth: '65ch',
						color: 'var(--tw-prose-body)',
						lineHeight: '1.75',
					},
				},
			},
			fontFamily: {
				serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
				sans: ['Inter', 'system-ui', 'sans-serif'],
			},
			backgroundImage: {
				'sad-light': 'linear-gradient(to bottom right, rgba(100, 120, 150, 0.05), rgba(60, 70, 90, 0.1))',
				'sad-dark': 'linear-gradient(to bottom right, rgba(20, 40, 60, 0.3), rgba(10, 20, 40, 0.4))',
				'joyful-light': 'linear-gradient(to bottom right, rgba(255, 240, 175, 0.1), rgba(255, 220, 150, 0.15))',
				'joyful-dark': 'linear-gradient(to bottom right, rgba(70, 60, 20, 0.3), rgba(60, 40, 10, 0.4))',
				'suspenseful-light': 'linear-gradient(to bottom right, rgba(40, 0, 0, 0.05), rgba(60, 0, 20, 0.1))',
				'suspenseful-dark': 'linear-gradient(to bottom right, rgba(40, 0, 0, 0.4), rgba(60, 0, 20, 0.5))',
			}
		}
	},
	plugins: [require("tailwindcss-animate"), require('@tailwindcss/typography')],
} satisfies Config;
