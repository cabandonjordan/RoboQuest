
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import * as FileSystem from 'expo-file-system/legacy';
import { SceneContext } from '../navigation/types';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
if (!API_KEY) throw new Error('Gemini API key not set');

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

async function fileToGenerativePart(uri: string): Promise<Part> {
    const base64Data = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
    });

    return {
        inlineData: {
            data: base64Data,
            mimeType: 'image/jpeg',
        },
    };
}

// Stage 1: Detect objects in image with scene context analysis
export async function detectObjectsInImage(imageUri: string) {
    console.log('🔍 Stage 1: Enhanced detection with scene context...');
    try {
        const imagePart = await fileToGenerativePart(imageUri);

        const prompt = `
You are an advanced object detection AI for RoboQuest, a gamified STEM education app.

🎯 DUAL TASK:
1. Detect scientifically interesting objects with bounding boxes
2. Analyze the overall scene context

📐 RETURN FORMAT: Valid JSON only, no markdown, no explanations.

{
  "sceneContext": {
    "location": "workspace|kitchen|classroom|garden|living_room|laboratory|outdoor|other",
    "description": "Brief scene description (1-2 sentences)",
    "suggestedLearningPath": ["object1_name", "object2_name"],
    "relatedConcepts": ["Force", "Energy", "Chemistry"]
  },
  "objects": [
    {
      "name": "Water Bottle",
      "confidence": 85,
      "boundingBox": {
        "x": 10,
        "y": 20,
        "width": 30,
        "height": 40
      }
    }
  ]
}

🔍 OBJECT DETECTION RULES:
1. Find 2-8 objects (prioritize larger, clearer items)
2. **CONFIDENCE THRESHOLD: Minimum 60% confidence required**
3. Each object must be scientifically interesting
4. Avoid generic items (wall, floor, background)
5. Categorize each as: Innovare, Generalis, Creativia

CATEGORIZATION:
Choose ONE primary category:
- "Innovare" - technology, innovation, engineering
- "Generalis" - general/everyday items
- "Creativia" - creative/music/art items

📏 BOUNDING BOX ACCURACY (CRITICAL):
- Coordinates in PERCENTAGES (0-100) relative to image
- x, y = TOP-LEFT corner (NOT center)
- width, height = TIGHT crop around object edges
- Add 2-3% padding but don't include other objects
- NO overlapping boxes (merge if overlap >40%)
- Minimum object size: 5% of image dimensions
- Be PRECISE - measure where object actually starts/ends

📝 NAMING RULES:
✅ DO: "Calculator", "Plastic Bottle", "Metal Spoon"
❌ DON'T: "Blue Water Container with White Cap"
- SHORT names (2-4 words max)
- Use English for objects

🎓 SCENE CONTEXT ANALYSIS:
- Identify overall setting (desk, kitchen, classroom, etc.)
- Suggest logical learning sequence for objects
- List STEM concepts present in scene

EXAMPLES:

Scene: Study Desk
{
  "sceneContext": {
    "location": "workspace",
    "description": "A student's study area with learning materials and electronic devices.",
    "suggestedLearningPath": ["Laptop", "Calculator", "LED Lamp"],
    "relatedConcepts": ["Electricity", "Circuits", "Energy Efficiency"]
  },
  "objects": [
    {
      "name": "Laptop",
      "confidence": 92,
      "category": "Innovare",
      "boundingBox": { "x": 15, "y": 20, "width": 35, "height": 40 }
    },
    {
      "name": "Scientific Calculator",
      "confidence": 88,
      "category": "Innovare",
      "boundingBox": { "x": 55, "y": 60, "width": 15, "height": 20 }
    }
  ]
}

Scene: Kitchen
{
  "sceneContext": {
    "location": "kitchen",
    "description": "A kitchen with cooking and food storage items.",
    "suggestedLearningPath": ["Rice Cooker", "Aluminum Pot", "Plastic Container"],
    "relatedConcepts": ["Heat Transfer", "Material Properties", "Food Chemistry"]
  },
  "objects": [
    {
      "name": "Rice Cooker",
      "confidence": 95,
      "category": "Innovare",
      "boundingBox": { "x": 30, "y": 25, "width": 25, "height": 35 }
    }
  ]
}
        `;

        const result = await model.generateContent([prompt, imagePart]);
        const response = result.response;
        const text = response.text();

        console.log("📝 Stage 1 Response (first 300 chars):", text.substring(0, 300) + "...");

        // Clean response (remove markdown formatting)
        let cleanedText = text.trim();
        cleanedText = cleanedText.replace(/```json\s*/g, '');
        cleanedText = cleanedText.replace(/```\s*/g, '');

        // Extract JSON
        const jsonStart = cleanedText.indexOf('{');
        const jsonEnd = cleanedText.lastIndexOf('}') + 1;

        if (jsonStart === -1 || jsonEnd === 0) {
            throw new Error("No valid JSON object found in detection response");
        }

        const jsonString = cleanedText.substring(jsonStart, jsonEnd);
        const parsed = JSON.parse(jsonString);

        // Add unique IDs to objects
        if (parsed.objects && Array.isArray(parsed.objects)) {
            parsed.objects = parsed.objects.map((obj: any, index: number) => ({
                ...obj,
                id: `obj_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 6)}`,
            }));
        }

        // Filter by confidence threshold (60%+)
        if (parsed.objects) {
            const originalCount = parsed.objects.length;
            parsed.objects = parsed.objects.filter((obj: any) => obj.confidence >= 60);
            const filteredCount = originalCount - parsed.objects.length;

            if (filteredCount > 0) {
                console.log(`🔽 Filtered out ${filteredCount} low-confidence objects (< 60%)`);
            }
        }

        console.log(`✓ Detected ${parsed.objects.length} objects with scene context`);

        // Log scene context for debugging
        if (parsed.sceneContext) {
            console.log(`📍 Scene: ${parsed.sceneContext.location} - ${parsed.sceneContext.description}`);
        }

        return parsed;

    } catch (error) {
        console.error('❌ Error detecting objects:', error);
        return {
            error: `Failed to detect objects. ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

// Single Mode: Detect and analyze the main/center object in one call
export async function detectAndAnalyzeMainObject(imageUri: string) {
    console.log('🎯 Single Mode: Detecting and analyzing main object...');
    try {
        const imagePart = await fileToGenerativePart(imageUri);

        const prompt = `
You are an advanced object detection and analysis AI for RoboQuest, a gamified STEM education app.

🎯 SINGLE MODE TASK:
1. Identify the MAIN object in the center/focus of the image
2. Provide its bounding box
3. Analyze it with fun facts and science explanation
4. Provide scene context

The main object is typically:
- Located near the center of the image (40-60% of image dimensions)
- The largest or most prominent object
- The primary subject the photographer focused on
- Scientifically interesting

📐 RETURN FORMAT: Valid JSON only, no markdown, no explanations.

{
  "sceneContext": {
    "location": "workspace|kitchen|classroom|garden|living_room|laboratory|outdoor|other",
    "description": "Brief scene description (1-2 sentences)",
    "relatedConcepts": ["Force", "Energy", "Chemistry"]
  },
  "object": {
    "name": "Water Bottle",
    "confidence": 85,
    "category": "Generalis",
    "boundingBox": {
      "x": 10,
      "y": 20,
      "width": 30,
      "height": 40
    },
    "funFact": "🤯 [Surprising fact about this object. Make it memorable! 2-3 sentences.]",
    "the_science_in_action": "🔬 [Core scientific principle. Use real examples. 3-4 sentences.]"
  }
}

🔍 MAIN OBJECT SELECTION RULES:
1. Focus on the object closest to image center (50%, 50%)
2. Prioritize larger, clearer objects
3. Must be scientifically interesting
4. Avoid generic items (wall, floor, background)
5. Minimum confidence: 60%

CATEGORIZATION:
Choose ONE primary category:
- "Innovare" - technology, innovation, engineering
- "Generalis" - general/everyday items
- "Creativia" - creative/music/art items

📏 BOUNDING BOX ACCURACY (CRITICAL):
- Coordinates in PERCENTAGES (0-100) relative to image
- x, y = TOP-LEFT corner (NOT center)
- width, height = TIGHT crop around object edges
- Add 2-3% padding but don't include other objects
- Be PRECISE - measure where object actually starts/ends

📝 NAMING RULES:
✅ DO: "Calculator", "Plastic Bottle", "Metal Spoon"
❌ DON'T: "Blue Water Container with White Cap"
- SHORT names (2-4 words max)
- Use English for objects

🎓 ANALYSIS QUALITY:
- Fun fact should be surprising and memorable
- Science explanation should be clear and educational
- Reference the scene context naturally if relevant

EXAMPLE:

{
  "sceneContext": {
    "location": "workspace",
    "description": "A student's study area with learning materials.",
    "relatedConcepts": ["Electricity", "Circuits", "Energy"]
  },
  "object": {
    "name": "Laptop",
    "confidence": 92,
    "category": "Innovare",
    "boundingBox": { "x": 25, "y": 30, "width": 50, "height": 40 },
    "funFact": "🤯 Modern laptops can perform billions of calculations per second, but they generate significant heat - that's why they need cooling fans! The processor inside can reach temperatures hot enough to cook an egg if not properly cooled.",
    "the_science_in_action": "🔬 Laptops demonstrate the principles of electrical circuits and heat transfer. Electricity flows through microscopic silicon pathways, creating resistance that generates heat. The cooling system uses conduction (heat moving through metal) and convection (fans moving air) to prevent overheating, showcasing thermodynamics in everyday technology."
  }
}
        `;

        const result = await model.generateContent([prompt, imagePart]);
        const response = result.response;
        const text = response.text();

        console.log("📝 Single Mode Response (first 300 chars):", text.substring(0, 300) + "...");

        // Clean response (remove markdown formatting)
        let cleanedText = text.trim();
        cleanedText = cleanedText.replace(/```json\s*/g, '');
        cleanedText = cleanedText.replace(/```\s*/g, '');

        // Extract JSON
        const jsonStart = cleanedText.indexOf('{');
        const jsonEnd = cleanedText.lastIndexOf('}') + 1;

        if (jsonStart === -1 || jsonEnd === 0) {
            throw new Error("No valid JSON object found in single mode response");
        }

        const jsonString = cleanedText.substring(jsonStart, jsonEnd);
        const parsed = JSON.parse(jsonString);

        // Validate and add ID to object
        if (parsed.object) {
            parsed.object.id = `obj_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
            
            // Filter by confidence threshold (60%+)
            if (parsed.object.confidence < 60) {
                throw new Error(`Object confidence too low: ${parsed.object.confidence}% (minimum 60%)`);
            }
        } else {
            throw new Error("No object found in single mode response");
        }

        console.log(`✓ Single Mode: Detected and analyzed "${parsed.object.name}"`);

        // Log scene context for debugging
        if (parsed.sceneContext) {
            console.log(`📍 Scene: ${parsed.sceneContext.location} - ${parsed.sceneContext.description}`);
        }

        return parsed;

    } catch (error) {
        console.error('❌ Error in single mode:', error);
        return {
            error: `Failed to detect and analyze main object. ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

// Stage 2: Analyze selected object with optional scene context
export async function analyzeSelectedObject(
    imageUri: string,
    objectName: string,
    boundingBox: { x: number; y: number; width: number; height: number },
    sceneContext?: SceneContext
) {
    console.log(`🔬 Stage 2: Analyzing "${objectName}"${sceneContext ? ' with scene context' : ''}...`);
    try {
        const imagePart = await fileToGenerativePart(imageUri);

        // Build scene context text if available
        const sceneContextText = sceneContext ? `

🌍 SCENE CONTEXT:
Location: ${sceneContext.location}
Description: ${sceneContext.description}
Related Concepts: ${sceneContext.relatedConcepts.join(', ')}

**IMPORTANT**: Reference this scene context naturally in your explanation. 
Show how "${objectName}" relates to other items in this ${sceneContext.location}.
` : '';

        const prompt = `
You are "RoboQuest AI" - an enthusiastic STEM educator.

🎯 CONTEXT: User selected "${objectName}" from an image.
Bounding box: x=${boundingBox.x}%, y=${boundingBox.y}%, width=${boundingBox.width}%, height=${boundingBox.height}%
${sceneContextText}

Focus ONLY on: "${objectName}"

CATEGORIZATION:
Choose ONE primary category:
- "Innovare" - technology, innovation, engineering
- "Generalis" - general/everyday items
- "Creativia" - creative/music/art items

CRITICAL: Return ONLY valid JSON. No markdown, no extra text.

{
  "objectName": "${objectName}",
  "confidence": <0-100>,
  "category": "<Innovare|Generalis|Creativia>",
  "funFact": "🤯 [Surprising fact. Make it memorable! 2-3 sentences.]",
  "the_science_in_action": "🔬 [Core scientific principle. Use real examples. 3-4 sentences.]"
}

💎 QUALITY CHECKLIST:
✓ Clear and engaging explanation
✓ Category accurately reflects primary concept
${sceneContext ? '✓ References scene context naturally' : ''}

Focus entirely on "${objectName}"!
        `;

        const result = await model.generateContent([prompt, imagePart]);
        const response = result.response;
        const text = response.text();

        console.log("📝 Stage 2 Response (first 200 chars):", text.substring(0, 200) + "...");

        // Clean response
        let cleanedText = text.trim();
        cleanedText = cleanedText.replace(/```json\s*/g, '');
        cleanedText = cleanedText.replace(/```\s*/g, '');

        const jsonStart = cleanedText.indexOf('{');
        const jsonEnd = cleanedText.lastIndexOf('}') + 1;

        if (jsonStart === -1 || jsonEnd === 0) {
            throw new Error("No valid JSON object found in analysis response");
        }

        const jsonString = cleanedText.substring(jsonStart, jsonEnd);
        const parsed = JSON.parse(jsonString);

        console.log(`✓ Successfully analyzed: ${parsed.objectName}`);
        return parsed;

    } catch (error) {
        console.error('❌ Error analyzing object:', error);
        return {
            error: `Failed to analyze object. ${error instanceof Error ? error.message : String(error)}`
        };
    }
}