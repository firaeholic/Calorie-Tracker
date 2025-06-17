# Calorie Tracker

A modern, responsive web application for tracking food intake and calculating macro-nutrients, built with React, Vite, and Tailwind CSS. The app uses Google's Gemini AI API to provide accurate nutritional information for foods.

## Features

- **Smart Food Search**
  - Real-time food suggestions as you type
  - Powered by Gemini AI for accurate food recognition

- **Flexible Portion Control**
  - Support for both grams and piece units
  - Customizable quantity input
  - Automatic nutrition scaling based on portion size

- **Comprehensive Nutrition Tracking**
  - Detailed macro-nutrient information (Protein, Carbs, Fat)
  - Calorie tracking
  - Weight tracking in grams
  - Running totals for all metrics

- **Visual Macro Distribution**
  - Interactive bar chart showing macro distribution
  - Percentage breakdown of calories from each macro
  - Color-coded visualization

- **Data Import/Export**
  - Export your diet plan as a text file
  - Import previously saved diet plans
  - Validation of imported data format

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory and add your Gemini API key:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

- `VITE_GEMINI_API_KEY`: Your Google Gemini API key (required for food suggestions and nutrition data)

## Usage

1. **Adding Foods**
   - Type a food name to get suggestions
   - Select the unit (grams or piece)
   - Enter the quantity
   - Click "Add" to include it in your tracker

2. **Viewing Nutrition**
   - See individual food items in the table
   - View total macros and calories
   - Check the macro distribution chart

3. **Managing Data**
   - Export your current diet plan using the "Export Diet" button
   - Import a previously saved diet plan using the "Import Diet" button
   - Imported files must match the application's data structure

## Technologies

- React
- TypeScript
- Vite
- Tailwind CSS
- Google Gemini AI API