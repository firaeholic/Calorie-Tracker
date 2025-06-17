import { useState, useEffect } from 'react'

interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  weight: number;
}

interface FoodSuggestion {
  name: string;
}

function App() {
  const [foodName, setFoodName] = useState('');
  const [unit, setUnit] = useState('grams');
  const [quantity, setQuantity] = useState('100');
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<FoodSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const exportDiet = () => {
    const dietData = JSON.stringify(foodItems, null, 2);
    const blob = new Blob([dietData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diet-plan.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importDiet = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedItems = JSON.parse(content) as FoodItem[];
        // Validate the structure
        const isValid = importedItems.every(item =>
          typeof item.name === 'string' &&
          typeof item.calories === 'number' &&
          typeof item.protein === 'number' &&
          typeof item.carbs === 'number' &&
          typeof item.fat === 'number' &&
          typeof item.weight === 'number'
        );
        if (isValid) {
          setFoodItems(importedItems);
        } else {
          setError('Invalid diet plan format');
        }
      } catch (err) {
        console.error('Error parsing diet plan:', err);
        setError('Failed to import diet plan. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const fetchSuggestions = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Given the input "${query}", suggest 5 common food items that match this input. Return only a JSON array of food names, like ["Apple", "Apricot"] for fruits starting with 'a'. Keep suggestions concise and relevant.`
            }]
          }],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 100
          }
        })
      });

      const data = await response.json();
      const responseText = data.candidates[0].content.parts[0].text;
      // Remove markdown formatting if present
      const jsonStr = responseText.replace(/```json\s*|```/g, '').trim();
      const suggestedFoods = JSON.parse(jsonStr);
      setSuggestions(suggestedFoods.map((name: string) => ({ name })));
      setShowSuggestions(true);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setSuggestions([]);
    }
  };

  const fetchNutritionInfo = async (foodName: string, unit: string): Promise<FoodItem> => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Provide accurate nutritional information for ${foodName} (${quantity} ${unit}). Return only a JSON object with name, calories, protein (g), carbs (g), fat (g), and weight (g). For piece units, convert to approximate weight in grams. Scale the values according to the quantity. Example format: {"name":"Apple","calories":95,"protein":0.5,"carbs":25,"fat":0.3,"weight":120}`
            }]
          }],
          generationConfig: {
            temperature: 0.2,
            topK: 32,
            topP: 1,
            maxOutputTokens: 150
          }
        })
      });

      const data = await response.json();
      const responseText = data.candidates[0].content.parts[0].text;
      // Remove markdown formatting if present
      const jsonStr = responseText.replace(/```json\s*|```/g, '').trim();
      const nutritionData = JSON.parse(jsonStr);
      return nutritionData;
    } catch (err) {
      setError('Failed to fetch nutrition information. Please try again.');
      console.error('Error fetching nutrition info:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (foodName) {
        fetchSuggestions(foodName);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [foodName]);


  const handleAddFood = async () => {
    if (!foodName.trim()) {
      setError('Please enter a food name');
      return;
    }
    
    try {
      const nutritionInfo = await fetchNutritionInfo(foodName, unit);
      setFoodItems([...foodItems, nutritionInfo]);
      setFoodName(''); // Clear input after adding
      setSuggestions([]); // Clear suggestions
      setShowSuggestions(false);
    } catch (err) {
      console.error('Error adding food:', err);
      // Error is already handled in fetchNutritionInfo
    }
  };

  const handleSelectSuggestion = (suggestion: FoodSuggestion) => {
    setFoodName(suggestion.name);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Calculate totals
  const totals = foodItems.reduce(
    (acc, item) => {
      return {
        calories: acc.calories + item.calories,
        protein: +(acc.protein + item.protein).toFixed(1),
        carbs: +(acc.carbs + item.carbs).toFixed(1),
        fat: +(acc.fat + item.fat).toFixed(1),
        weight: +(acc.weight + item.weight).toFixed(1)
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, weight: 0 }
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl overflow-hidden">
        <div className="p-6 md:p-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 text-center">Macro Tracker</h1>
          
          {/* Search and Add Form */}
          <div className="flex flex-col md:flex-row gap-3 mb-8">
            <div className="flex-grow relative">
              <input
                type="text"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search food (e.g. banana, boiled egg)"
                className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              
              {/* Food Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white/95 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 max-h-60 overflow-auto">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className="w-full px-4 py-2 text-left text-gray-800 hover:bg-indigo-50 transition-colors cursor-pointer"
                    >
                      {suggestion.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <div className="w-24">
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>
              <div className="w-32">
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <option value="grams">grams</option>
                  <option value="piece">piece</option>
                </select>
              </div>
            </div>
            
            <button
              onClick={handleAddFood}
              disabled={isLoading}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-semibold shadow-lg hover:from-emerald-500 hover:to-teal-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading
                </span>
              ) : 'Add'}
            </button>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-white">
              {error}
            </div>
          )}
          
          {/* Food Items Table */}
          <div className="overflow-x-auto rounded-lg mb-6">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-black/20 text-white">
                  <th className="px-4 py-3 text-left">Food Name</th>
                  <th className="px-4 py-3 text-center">Protein (g)</th>
                  <th className="px-4 py-3 text-center">Carbs (g)</th>
                  <th className="px-4 py-3 text-center">Fat (g)</th>
                  <th className="px-4 py-3 text-center">Calories</th>
                  <th className="px-4 py-3 text-center">Weight (g)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {foodItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-white/70 italic">
                      No food items added yet. Search and add some food to track your macros!
                    </td>
                  </tr>
                ) : (
                  foodItems.map((item, index) => (
                    <tr key={index} className="bg-white/5 hover:bg-white/10 transition-colors text-white">
                      <td className="px-4 py-3">{item.name}</td>
                      <td className="px-4 py-3 text-center">{item.protein}</td>
                      <td className="px-4 py-3 text-center">{item.carbs}</td>
                      <td className="px-4 py-3 text-center">{item.fat}</td>
                      <td className="px-4 py-3 text-center">{item.calories}</td>
                      <td className="px-4 py-3 text-center">{item.weight}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {foodItems.length > 0 && (
                <tfoot>
                  <tr className="bg-black/30 font-semibold text-white">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-center">{totals.protein}</td>
                    <td className="px-4 py-3 text-center">{totals.carbs}</td>
                    <td className="px-4 py-3 text-center">{totals.fat}</td>
                    <td className="px-4 py-3 text-center">{totals.calories}</td>
                    <td className="px-4 py-3 text-center">{totals.weight}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          
          {/* Import/Export Buttons */}
          <div className="flex gap-4 mb-8">
            <label className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-400 to-indigo-500 text-white font-semibold shadow-lg hover:from-blue-500 hover:to-indigo-600 transition-all duration-300 cursor-pointer">
              Import Diet
              <input
                type="file"
                accept=".txt"
                onChange={importDiet}
                className="hidden"
              />
            </label>
            <button
              onClick={exportDiet}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-400 to-pink-500 text-white font-semibold shadow-lg hover:from-purple-500 hover:to-pink-600 transition-all duration-300"
            >
              Export Diet
            </button>
          </div>

          {/* Macro Distribution Chart - Visual representation */}
          {foodItems.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-white mb-4">Macro Distribution</h2>
              <div className="flex h-8 rounded-full overflow-hidden">
                {totals.protein + totals.carbs + totals.fat > 0 && (
                  <>
                    <div 
                      className="bg-blue-500 h-full" 
                      style={{ width: `${(totals.protein / (totals.protein + totals.carbs + totals.fat)) * 100}%` }}
                      title={`Protein: ${totals.protein}g`}
                    />
                    <div 
                      className="bg-purple-500 h-full" 
                      style={{ width: `${(totals.carbs / (totals.protein + totals.carbs + totals.fat)) * 100}%` }}
                      title={`Carbs: ${totals.carbs}g`}
                    />
                    <div 
                      className="bg-yellow-500 h-full" 
                      style={{ width: `${(totals.fat / (totals.protein + totals.carbs + totals.fat)) * 100}%` }}
                      title={`Fat: ${totals.fat}g`}
                    />
                  </>
                )}
              </div>
              <div className="flex justify-between mt-2 text-sm text-white">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                  <span>Protein: {totals.protein}g ({((totals.protein * 4 / totals.calories) * 100).toFixed(1)}%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-1"></div>
                  <span>Carbs: {totals.carbs}g ({((totals.carbs * 4 / totals.calories) * 100).toFixed(1)}%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
                  <span>Fat: {totals.fat}g ({((totals.fat * 9 / totals.calories) * 100).toFixed(1)}%)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <footer className="mt-8 text-center text-white/70 text-sm">
        <p>Calorie Tracker App - Track your nutrition with ease</p>
      </footer>
    </div>
  )
}

export default App
