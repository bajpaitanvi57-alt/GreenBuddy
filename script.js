
import { pipeline, env } from
    "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2";

// Download models from Hugging Face.
env.allowLocalModels = false;

// Keep the model loaded so we do not reload it every time.
let generator = null;
let currentQuest = null;

// Get the HTML elements.
const form = document.getElementById("questForm");
const button = document.getElementById("generateBtn");
const status = document.getElementById("status");
const result = document.getElementById("result");
const completeBtn = document.getElementById("completeBtn");

// Load the open-weight AI model.
async function getAI() {
    if (!generator) {
        status.textContent = "Loading AI model... Please wait.";

        generator = await pipeline(
            "text2text-generation",
            "Xenova/LaMini-Flan-T5-248M"
        );
    }

    return generator;
}

// Create a new quest when the form is submitted.
form.addEventListener("submit", async function(event) {
    event.preventDefault();

    button.disabled = true;
    status.textContent = "Creating your outdoor quest...";
    result.hidden = true;

    try {
        // Read the user's selected preferences.
        const time = document.getElementById("time").value;
        const mood = document.getElementById("mood").value;
        const place = document.getElementById("place").value;

        // Tell the AI what to create.
        const prompt = `
        Create a safe outdoor activity for ${time}.
        Mood: ${mood}.
        Location: ${place}.

        Return this format:
        TITLE: short title
        DESCRIPTION: one sentence
        STEPS:
        1. First action
        2. Second action
        3. Third action
        REFLECTION: one question

        Keep the activity beginner-friendly.
        Do not suggest risky activities, trespassing,
        or disturbing plants and animals.
        `;

        // Load the AI and generate text.
        const ai = await getAI();

        status.textContent = "AI is thinking...";

        const output = await ai(prompt, {
            max_new_tokens: 150
        });

        const text = output[0].generated_text;

        // Display the response.
        displayQuest(text);

        status.textContent = "Quest created by open-weight AI 🌱";

    } catch (error) {
        console.error(error);

        status.textContent =
            "AI could not load. Check your internet connection and try again.";
    } finally {
        button.disabled = false;
    }
});

// Extract the title, description, steps, and reflection.
function displayQuest(text) {
    const titleMatch = text.match(/TITLE:\s*(.*)/i);
    const descriptionMatch = text.match(/DESCRIPTION:\s*(.*)/i);
    const reflectionMatch = text.match(/REFLECTION:\s*(.*)/i);

    const title = titleMatch
        ? titleMatch[1].trim()
        : "Your Outdoor Quest";

    const description = descriptionMatch
        ? descriptionMatch[1].trim()
        : "Explore the world around you.";

    const reflection = reflectionMatch
        ? reflectionMatch[1].trim()
        : "What did you notice outside?";

    // Read the steps between STEPS and REFLECTION.
    const stepsMatch = text.match(
        /STEPS:\s*([\s\S]*?)(?=REFLECTION:|$)/i
    );

    const stepsText = stepsMatch ? stepsMatch[1] : "";

    const steps = stepsText
        .split("\n")
        .map(step => step.replace(/^\s*\d+[\.\)]\s*/, "").trim())
        .filter(Boolean);

    // Put text into HTML elements safely.
    document.getElementById("questTitle").textContent = title;
    document.getElementById("questDescription").textContent = description;
    document.getElementById("reflection").textContent =
        "Think about this: " + reflection;

    const list = document.getElementById("questSteps");
    list.replaceChildren();

    const safeSteps = steps.length
        ? steps.slice(0, 5)
        : [
            "Notice three things in nature.",
            "Pause and listen to nearby sounds.",
            "Think about one thing you enjoyed."
        ];

    safeSteps.forEach(function(step) {
        const li = document.createElement("li");
        li.textContent = step;
        list.appendChild(li);
    });

    currentQuest = title;
    completeBtn.disabled = false;
    completeBtn.textContent = "I Completed It ✓";
    result.hidden = false;
}

// Save a completed quest to the browser.
completeBtn.addEventListener("click", function() {
    if (!currentQuest) return;

    const journal = JSON.parse(
        localStorage.getItem("greenbuddy-journal") || "[]"
    );

    journal.unshift({
        title: currentQuest,
        date: new Date().toLocaleDateString()
    });

    localStorage.setItem(
        "greenbuddy-journal",
        JSON.stringify(journal)
    );

    renderJournal();

    completeBtn.textContent = "Saved to Journal ✓";
    completeBtn.disabled = true;
});

// Display the saved journal entries.
function renderJournal() {
    const journal = JSON.parse(
        localStorage.getItem("greenbuddy-journal") || "[]"
    );

    const list = document.getElementById("journal");
    list.replaceChildren();

    if (journal.length === 0) {
        const item = document.createElement("li");
        item.textContent = "Your first nature memory is waiting 🌼";
        list.appendChild(item);
        return;
    }

    journal.forEach(function(entry) {
        const item = document.createElement("li");
        item.textContent = `${entry.title} — ${entry.date}`;
        list.appendChild(item);
    });
}

// Show previously saved entries when the page opens.
renderJournal();