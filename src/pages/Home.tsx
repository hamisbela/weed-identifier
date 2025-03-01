import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Upload, Flower2, Loader2 } from 'lucide-react';
import { analyzeImage } from '../lib/gemini';
import SupportBlock from '../components/SupportBlock';

// Default weed image path
const DEFAULT_IMAGE = "/default-weed.jpg";

// Default analysis for the weed
const DEFAULT_ANALYSIS = `1. Weed Identification:
- Name: Dandelion (Taraxacum officinale)
- Type: Perennial broadleaf weed
- Family: Asteraceae (daisy family)
- Appearance: Bright yellow flowers, toothed leaves in a basal rosette
- Distinguishing Features: Hollow stems with milky sap, fluffy seed heads

2. Growth Characteristics:
- Life Cycle: Perennial (lives for multiple years)
- Height: 2-18 inches (5-45 cm)
- Root System: Deep taproot, can extend 10-15 inches into soil
- Reproduction: Primarily by wind-dispersed seeds
- Growth Season: Spring through fall, flowers mainly in spring and early summer

3. Ecological Impact:
- Habitat: Lawns, gardens, meadows, roadsides, disturbed areas
- Distribution: Native to Europe, now found worldwide
- Invasiveness: Considered invasive in many regions
- Ecological Role: Early nectar source for pollinators
- Soil Indicator: Often indicates slightly acidic, compacted soil

4. Management & Control:
- Manual Removal: Hand-pulling or digging (remove entire taproot)
- Chemical Control: Broadleaf herbicides containing 2,4-D, dicamba, or MCPP
- Cultural Control: Maintain healthy lawn, proper mowing height
- Prevention: Proper lawn care, removing seed heads before dispersal
- Natural Control: Vinegar solutions, boiling water for spot treatment

5. Additional Information:
- Edible Uses: Young leaves for salads, flowers for wine, roots for tea
- Medicinal Properties: Traditional uses for liver support, diuretic properties
- Nutritional Value: Rich in vitamins A, C, K, and minerals
- Similar Weeds: Cat's ear, hawkweed, wild lettuce
- Interesting Facts: Each plant can produce up to 20,000 seeds per year`;

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load default image and analysis without API call
    const loadDefaultContent = async () => {
      try {
        setLoading(true);
        const response = await fetch(DEFAULT_IMAGE);
        if (!response.ok) {
          throw new Error('Failed to load default image');
        }
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setImage(base64data);
          setAnalysis(DEFAULT_ANALYSIS);
          setLoading(false);
        };
        reader.onerror = () => {
          setError('Failed to load default image');
          setLoading(false);
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error('Error loading default image:', err);
        setError('Failed to load default image');
        setLoading(false);
      }
    };

    loadDefaultContent();
  }, []);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError('Image size should be less than 20MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImage(base64String);
      setError(null);
      handleAnalyze(base64String);
    };
    reader.onerror = () => {
      setError('Failed to read the image file. Please try again.');
    };
    reader.readAsDataURL(file);

    // Reset the file input so the same file can be selected again
    e.target.value = '';
  }, []);

  const handleAnalyze = async (imageData: string) => {
    setLoading(true);
    setError(null);
    const weedPrompt = "Analyze this weed image for educational purposes and provide the following information:\n1. Weed identification (name, type, family, appearance, distinguishing features)\n2. Growth characteristics (life cycle, height, root system, reproduction, growth season)\n3. Ecological impact (habitat, distribution, invasiveness, ecological role)\n4. Management and control methods (manual, chemical, cultural, prevention)\n5. Additional information (edible uses, medicinal properties, similar weeds, interesting facts)\n\nIMPORTANT: This is for educational purposes only.";
    try {
      const result = await analyzeImage(imageData, weedPrompt);
      setAnalysis(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze image. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const formatAnalysis = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Remove any markdown-style formatting
      const cleanLine = line.replace(/[*_#`]/g, '').trim();
      if (!cleanLine) return null;

      // Format section headers (lines starting with numbers)
      if (/^\d+\./.test(cleanLine)) {
        return (
          <div key={index} className="mt-8 first:mt-0">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {cleanLine.replace(/^\d+\.\s*/, '')}
            </h3>
          </div>
        );
      }
      
      // Format list items with specific properties
      if (cleanLine.startsWith('-') && cleanLine.includes(':')) {
        const [label, ...valueParts] = cleanLine.substring(1).split(':');
        const value = valueParts.join(':').trim();
        return (
          <div key={index} className="flex gap-2 mb-3 ml-4">
            <span className="font-semibold text-gray-800 min-w-[120px]">{label.trim()}:</span>
            <span className="text-gray-700">{value}</span>
          </div>
        );
      }
      
      // Format regular list items
      if (cleanLine.startsWith('-')) {
        return (
          <div key={index} className="flex gap-2 mb-3 ml-4">
            <span className="text-gray-400">•</span>
            <span className="text-gray-700">{cleanLine.substring(1).trim()}</span>
          </div>
        );
      }

      // Regular text
      return (
        <p key={index} className="mb-3 text-gray-700">
          {cleanLine}
        </p>
      );
    }).filter(Boolean);
  };

  return (
    <div className="bg-gray-50 py-6 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Free Weed Identifier</h1>
          <p className="text-base sm:text-lg text-gray-600">Upload a weed photo for educational identification and botanical information</p>
        </div>

        <div className="mt-8 bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-12">
          <div className="flex flex-col items-center justify-center mb-6">
            <label 
              htmlFor="image-upload"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer w-full sm:w-auto"
            >
              <Upload className="h-5 w-5" />
              Upload Weed Photo
              <input
                ref={fileInputRef}
                id="image-upload"
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/jpg,image/webp"
                onChange={handleImageUpload}
              />
            </label>
            <p className="mt-2 text-sm text-gray-500">PNG, JPG, JPEG or WEBP (MAX. 20MB)</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-md">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {loading && !image && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="animate-spin h-8 w-8 text-green-600" />
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          )}

          {image && (
            <div className="mb-6">
              <div className="relative rounded-lg mb-4 overflow-hidden bg-gray-100">
                <img
                  src={image}
                  alt="Weed preview"
                  className="w-full h-auto max-h-[500px] object-contain mx-auto"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleAnalyze(image)}
                  disabled={loading}
                  className="flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Flower2 className="-ml-1 mr-2 h-5 w-5" />
                      Identify Weed
                    </>
                  )}
                </button>
                <button
                  onClick={triggerFileInput}
                  className="flex items-center justify-center px-4 py-2 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Another Photo
                </button>
              </div>
            </div>
          )}

          {analysis && (
            <div className="bg-gray-50 rounded-lg p-6 sm:p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Weed Analysis Results</h2>
              <div className="text-gray-700">
                {formatAnalysis(analysis)}
              </div>
            </div>
          )}
        </div>

        <SupportBlock />

        <div className="prose max-w-none my-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">Free Weed Identifier: Your Educational Guide to Garden Weeds</h2>
          
          <p>Welcome to our free weed identifier tool, powered by advanced artificial intelligence technology.
             This educational tool helps you learn about different garden weeds, their properties, and
             essential information about their botanical characteristics and control methods.</p>

          <h3>How Our Educational Weed Identifier Works</h3>
          <p>Our tool uses AI to analyze weed photos and provide educational information about plant
             identification, growth characteristics, and ecological attributes. Simply upload a clear photo of a weed,
             and our AI will help you learn about its type and characteristics.</p>

          <h3>Key Features of Our Weed Identifier</h3>
          <ul>
            <li>Educational botanical information</li>
            <li>Detailed growth characteristics</li>
            <li>Ecological impact details</li>
            <li>Management and control methods</li>
            <li>Additional uses and properties</li>
            <li>100% free to use</li>
          </ul>

          <h3>Perfect For Learning About:</h3>
          <ul>
            <li>Garden and lawn weed identification</li>
            <li>Botanical properties and characteristics</li>
            <li>Growth patterns and reproduction</li>
            <li>Effective control and management strategies</li>
            <li>Potential beneficial uses of common weeds</li>
          </ul>

          <p>Try our free weed identifier today and expand your knowledge of garden botany!
             No registration required - just upload a photo and start learning about common weeds from around the world.</p>
        </div>

        <SupportBlock />
      </div>
    </div>
  );
}