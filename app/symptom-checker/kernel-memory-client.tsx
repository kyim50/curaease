interface MedicalConversation {
    doctor: string;
    patient: string;
    symptoms: string[];
    diagnosis: string;
    treatment: string;
  }
  
  export class KernelMemoryClient {
    private medicalKnowledge: MedicalConversation[] = [];
    private isInitialized: boolean = false;
  
    /**
     * Loads the medical dataset from the backend
     */
    async loadMedicalDataset(pageOrFilePath: number | string, limit: number = 100): Promise<void> {
      try {
        if (typeof pageOrFilePath === 'string') {
          // Handle file path logic
          console.log(`Loading dataset from file: ${pageOrFilePath}`);
          // Implement file loading logic here - perhaps using fetch or another method to load the file
          this.isInitialized = true;
        } else {
          // Existing pagination logic
          const page = pageOrFilePath;
          const response = await fetch(`http://localhost:5000/api/medical-dataset?page=${page}&limit=${limit}`);
          if (!response.ok) throw new Error('Failed to fetch dataset');
      
          this.medicalKnowledge = await response.json();
          console.log(`Loaded page ${page} with ${this.medicalKnowledge.length} records`);
          this.isInitialized = true;
        }
      } catch (error) {
        console.error('Error loading medical dataset:', error);
      }
    }
  
    /**
     * Searches the medical knowledge base for relevant information
     * @param query User query to search against
     * @returns String of relevant medical information
     */
    async searchMedicalKnowledge(query: string): Promise<string> {
      if (!this.isInitialized) {
        console.warn('Medical knowledge base not initialized');
        return "No medical knowledge available.";
      }
  
      try {
        const keywords = this.extractKeywords(query);
        const relevantConversations = this.medicalKnowledge
          .filter(conv =>
            keywords.some(keyword =>
              conv.symptoms.some(symptom => symptom.toLowerCase().includes(keyword)) ||
              conv.diagnosis.toLowerCase().includes(keyword) ||
              conv.treatment.toLowerCase().includes(keyword)
            )
          )
          .slice(0, 3);
  
        if (relevantConversations.length === 0) {
          return "No specific medical context found for this query.";
        }
  
        return relevantConversations.map(conv => `
  PATIENT SYMPTOMS: ${conv.symptoms.join(', ')}
  DIAGNOSIS: ${conv.diagnosis}
  TREATMENT: ${conv.treatment}
  DOCTOR NOTES: ${conv.doctor}
  ---
        `).join('\n');
      } catch (error) {
        console.error('Error searching medical knowledge:', error);
        return "Error retrieving medical information.";
      }
    }
  
    /**
     * Extracts keywords from the user query
     * @param query User input query
     * @returns Array of keywords
     */
    private extractKeywords(query: string): string[] {
      const stopWords = new Set(["i", "me", "my", "we", "our", "you", "your", "he", "she", "it", "they", "them", "what", "which", "who", "this", "that", "these", "those", "is", "are", "was", "were", "be", "been", "have", "has", "had", "doing", "a", "an", "the", "and", "but", "if", "or", "because", "as", "until", "while", "of", "at", "by", "for", "with", "about", "against", "between", "into", "through", "during", "before", "after", "above", "below", "to", "from", "up", "down", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "can", "will", "just", "don", "should", "now"]);
      
      return query.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(' ')
        .filter(word => !stopWords.has(word) && word.length > 2);
    }
  }