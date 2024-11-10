import React, { useEffect, useState } from 'react';
import RecipeList from '../components/RecipeList';
import { useRecipesContext } from '../hooks/useRecipesContext';
import { useNavigate } from 'react-router-dom';
import chatbotIcon from '../images/chatbot.png';

const Main = () => {
    const { state, dispatch } = useRecipesContext();
    const { recipes } = state;
    const navigate = useNavigate();
    const [showChatbot, setShowChatbot] = useState(false);
    const [ingredients, setIngredients] = useState('');
    const [suggestedRecipe, setSuggestedRecipe] = useState(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [videoUrl, setVideoUrl] = useState(null);

    useEffect(() => {
        const fetchRecipes = async () => {
            try {
                const response = await fetch('/api/recipes');
                const json = await response.json();
                if (response.ok) {
                    dispatch({ type: "SET_RECIPES", payload: json });
                } else {
                    console.error('Failed to fetch recipes:', json);
                }
            } catch (error) {
                console.error('Error fetching recipes:', error);
            }
        };
        fetchRecipes();
    }, [dispatch]);

    const gotocuisine = (cuisine) => {
        navigate(`/cuisines/${cuisine}`);
    };

    const toggleChatbot = () => {
        setShowChatbot(!showChatbot);
    };

    const generateRecipeSuggestion = async () => {
        const userIngredients = ingredients.toLowerCase().split(',').map(item => item.trim());

        if (userIngredients.length < 3) {
            setSuggestedRecipe({ name: "Please enter at least three ingredients (e.g., chicken, onion, rice) to get a recipe suggestion." });
            return;
        }

        const ingredientQuery = userIngredients.join(',');

        try {
            const response = await fetch(`https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredientQuery}&number=1&apiKey=4c7530f348844722adb0a1218f9e4567`);
            const data = await response.json();

            if (data && data.length > 0) {
                const recipe = data[0];
                const recipeDetailsResponse = await fetch(`https://api.spoonacular.com/recipes/${recipe.id}/information?apiKey=4c7530f348844722adb0a1218f9e4567`);
                const recipeDetails = await recipeDetailsResponse.json();

                setSuggestedRecipe({
                    name: recipeDetails.title,
                    ingredients: recipeDetails.extendedIngredients.map(ing => ing.original).join(', '),
                    instructions: recipeDetails.instructions || 'No instructions available for this recipe.'
                });

                // Fetch video based on the recipe name
                fetchVideoForRecipe(recipeDetails.title);

                // Read recipe aloud
                readRecipeAloud(recipeDetails.title, recipeDetails.extendedIngredients, recipeDetails.instructions);
            } else {
                setSuggestedRecipe({ name: "No matching recipe found. Try adding more relevant ingredients." });
            }
        } catch (error) {
            console.error('Error fetching recipes:', error);
            setSuggestedRecipe({ name: "Error fetching recipes. Please try again later." });
        }
    };

    const fetchVideoForRecipe = async (recipeName) => {
        try {
            // Fetching video based on recipe name from YouTube API
            const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(recipeName)}&type=video&key=AIzaSyBav3a7LMrOrFKCjUHbfuwSQ45YM9Cq1_s`);
            const videoData = await response.json();
            if (videoData.items && videoData.items.length > 0) {
                setVideoUrl(`https://www.youtube.com/embed/${videoData.items[0].id.videoId}`);
            } else {
                setVideoUrl(null);
                console.log('No video found for this recipe.');
            }
        } catch (error) {
            console.error('Error fetching video:', error);
        }
    };

    const readRecipeAloud = (recipeName, ingredients, instructions) => {
        const ingredientText = ingredients.map(ing => ing.original).join(', ');
        const recipeText = `The recipe for ${recipeName} includes the ingredients: ${ingredientText}. Instructions: ${instructions}`;

        const utterance = new SpeechSynthesisUtterance(recipeText);
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);

        speechSynthesis.speak(utterance);
    };

    const stopSpeaking = () => {
        speechSynthesis.cancel();
        setIsSpeaking(false);
    };

    return (
        <div className="main-page" style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h2>Top Liked Recipes</h2>
            <div className="recipe-list">
                {recipes && recipes.length > 0 ? (
                    recipes.map((recipe) => <RecipeList key={recipe._id} recipe={recipe} />)
                ) : (
                    <p>No recipes yet</p>
                )}
            </div>
            <h1>Recipes by Cuisine</h1>
            {['Indian', 'Japanese', 'Italian', 'Thai', 'Mexican', 'French', 'Greek', 'Other'].map((cuisine) => (
                <button
                    key={cuisine}
                    onClick={() => gotocuisine(cuisine)}
                    style={{
                        margin: '5px',
                        padding: '10px 20px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                    }}
                >
                    {cuisine}
                </button>
            ))}

            <img
                src={chatbotIcon}
                alt="Chatbot"
                onClick={toggleChatbot}
                style={{
                    width: '50px',
                    height: '50px',
                    cursor: 'pointer',
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px'
                }}
            />

            {showChatbot && (
                <div style={{
                    position: 'fixed',
                    bottom: '80px',
                    right: '20px',
                    width: '300px',
                    padding: '20px',
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
                    borderRadius: '10px',
                    zIndex: 1000
                }}>
                    <button
                        onClick={toggleChatbot}
                        style={{
                            float: 'right',
                            fontSize: '18px',
                            cursor: 'pointer',
                            background: 'none',
                            border: 'none',
                            color: '#888'
                        }}
                    >X</button>
                    <h3>Recipe Suggestion Chatbot</h3>
                    <p>Enter your available ingredients:</p>
                    <input
                        type="text"
                        value={ingredients}
                        onChange={(e) => setIngredients(e.target.value)}
                        placeholder="e.g., chicken, broccoli"
                        style={{
                            width: '100%',
                            padding: '10px',
                            margin: '10px 0',
                            borderRadius: '5px',
                            border: '1px solid #ccc'
                        }}
                    />
                    <button
                        onClick={generateRecipeSuggestion}
                        style={{
                            width: '100%',
                            padding: '10px',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }}
                    >
                        Get Recipe
                    </button>
                    {suggestedRecipe && (
                        <div style={{ marginTop: '10px', color: '#333' }}>
                            <h4>Suggested Recipe:</h4>
                            <p>{suggestedRecipe.name}</p>
                        </div>
                    )}
                    {isSpeaking && (
                        <button
                            onClick={stopSpeaking}
                            style={{
                                width: '100%',
                                padding: '10px',
                                backgroundColor: '#f44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                marginTop: '10px'
                            }}
                        >
                            Stop Listening
                        </button>
                    )}
                    {videoUrl && (
                        <div style={{ marginTop: '10px' }}>
                            <iframe
                                title="recipe-video"
                                width="100%"
                                height="315"
                                src={videoUrl}
                                frameBorder="0"
                                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Main;
