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
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))'
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
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(20px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'slide-in-right': {
					'0%': { transform: 'translateX(100px)', opacity: '0' },
					'100%': { transform: 'translateX(0)', opacity: '1' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				'pulse-glow': {
					'0%, 100%': { boxShadow: '0 0 20px hsl(var(--primary) / 0.3)' },
					'50%': { boxShadow: '0 0 40px hsl(var(--primary) / 0.6)' }
				},
				'corner-glow-tl': {
					'0%, 100%': { 
						opacity: '0.4', 
						boxShadow: '0 0 10px hsl(var(--primary) / 0.5)',
						transform: 'scale(1)'
					},
					'50%': { 
						opacity: '0.8', 
						boxShadow: '0 0 20px hsl(var(--primary) / 0.8)',
						transform: 'scale(1.2)'
					}
				},
				'corner-glow-tr': {
					'0%, 100%': { 
						opacity: '0.4', 
						boxShadow: '0 0 10px hsl(var(--secondary) / 0.5)',
						transform: 'scale(1)'
					},
					'50%': { 
						opacity: '0.8', 
						boxShadow: '0 0 20px hsl(var(--secondary) / 0.8)',
						transform: 'scale(1.2)'
					}
				},
				'corner-glow-bl': {
					'0%, 100%': { 
						opacity: '0.4', 
						boxShadow: '0 0 10px hsl(var(--accent) / 0.5)',
						transform: 'scale(1)'
					},
					'50%': { 
						opacity: '0.8', 
						boxShadow: '0 0 20px hsl(var(--accent) / 0.8)',
						transform: 'scale(1.2)'
					}
				},
				'corner-glow-br': {
					'0%, 100%': { 
						opacity: '0.4', 
						boxShadow: '0 0 10px hsl(var(--primary-glow) / 0.5)',
						transform: 'scale(1)'
					},
					'50%': { 
						opacity: '0.8', 
						boxShadow: '0 0 20px hsl(var(--primary-glow) / 0.8)',
						transform: 'scale(1.2)'
					}
				}
			},
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))'
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.6s ease-out',
				'slide-in-right': 'slide-in-right 0.5s ease-out',
				'float': 'float 3s ease-in-out infinite',
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
				'corner-glow-tl': 'corner-glow-tl 2s ease-in-out infinite',
				'corner-glow-tr': 'corner-glow-tr 2s ease-in-out infinite',
				'corner-glow-bl': 'corner-glow-bl 2s ease-in-out infinite',
				'corner-glow-br': 'corner-glow-br 2s ease-in-out infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
