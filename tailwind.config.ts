import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				'100': '#E8F6E4',
  				'200': '#C7E9BF',
  				'300': '#A6DB99',
  				'400': '#85CD74',
  				'500': '#63c550',
  				'600': '#50A040',
  				'700': '#3D7C30',
  				'800': '#2A5820',
  				'900': '#173410',
  				DEFAULT: '#63c550',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			success: {
  				'100': '#E1FBD6',
  				'200': '#BDF7AF',
  				'300': '#8DE883',
  				'400': '#61D260',
  				'500': '#32B53D',
  				'600': '#249B39',
  				'700': '#198235',
  				'800': '#0F682F',
  				'900': '#09562C'
  			},
  			info: {
  				'100': '#F6ECFE',
  				'200': '#ECD9FE',
  				'300': '#DFC5FC',
  				'400': '#D3B6FA',
  				'500': '#c19ef8',
  				'600': '#9573D5',
  				'700': '#6E4FB2',
  				'800': '#4B328F',
  				'900': '#321E77'
  			},
  			warning: {
  				'100': '#FFFDD4',
  				'200': '#FFFAAA',
  				'300': '#FFF77F',
  				'400': '#FFF460',
  				'500': '#FFF02B',
  				'600': '#DBCC1F',
  				'700': '#B7A915',
  				'800': '#93870D',
  				'900': '#7A6E08'
  			},
  			danger: {
  				'100': '#FFE7D8',
  				'200': '#FFCAB2',
  				'300': '#FFA68B',
  				'400': '#FF846F',
  				'500': '#FF4C3F',
  				'600': '#DB2E30',
  				'700': '#B71F2E',
  				'800': '#93142B',
  				'900': '#7A0C29'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
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
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
