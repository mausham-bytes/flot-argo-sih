export interface ArgoFloat {
  id: string;
  wmo_id: string;
  lat: number;
  lon: number;
  status: 'active' | 'inactive';
  last_profile: string;
  temperature?: number;
  salinity?: number;
  oxygen?: number;
  platform_type: string;
  cycle_number: number;
}

export interface ProfileData {
  depth: number[];
  temperature: number[];
  salinity: number[];
  oxygen?: number[];
  pressure: number[];
}

export interface ChatResponse {
  text: string;
  data?: any;
  floats?: ArgoFloat[];
  profiles?: ProfileData;
}

class ArgoApiService {
  private baseUrl = '/api';

  async getFloats(region?: string, status?: string): Promise<ArgoFloat[]> {
    try {
      const params = new URLSearchParams();
      if (region) params.append('region', region);
      if (status) params.append('status', status);
      
      const response = await fetch(`${this.baseUrl}/floats?${params}`);
      if (!response.ok) {
        // Return mock data if API is not available
        return this.getMockFloats();
      }
      return await response.json();
    } catch (error) {
      console.warn('API not available, using mock data:', error);
      return this.getMockFloats();
    }
  }

  async getFloatProfile(floatId: string): Promise<ProfileData> {
    try {
      const response = await fetch(`${this.baseUrl}/floats/${floatId}/profile`);
      if (!response.ok) {
        return this.getMockProfile();
      }
      return await response.json();
    } catch (error) {
      console.warn('API not available, using mock profile:', error);
      return this.getMockProfile();
    }
  }

  async chatQuery(query: string): Promise<ChatResponse> {
    try {
      const response = await fetch('/chat/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        return this.getMockChatResponse(query);
      }

      return await response.json();
    } catch (error) {
      console.warn('Chat API not available, using mock response:', error);
      return this.getMockChatResponse(query);
    }
  }

  private getMockFloats(): ArgoFloat[] {
    return [
      {
        id: 'WMO_6901234',
        wmo_id: '6901234',
        lat: 35.5,
        lon: -15.2,
        status: 'active',
        last_profile: '2024-01-15T10:30:00Z',
        temperature: 18.4,
        salinity: 36.1,
        oxygen: 6.8,
        platform_type: 'APEX',
        cycle_number: 245
      },
      {
        id: 'WMO_6901235',
        wmo_id: '6901235',
        lat: 42.1,
        lon: -8.7,
        status: 'active',
        last_profile: '2024-01-14T15:45:00Z',
        temperature: 15.2,
        salinity: 35.8,
        oxygen: 6.2,
        platform_type: 'NOVA',
        cycle_number: 189
      },
      {
        id: 'WMO_6901236',
        wmo_id: '6901236',
        lat: 38.9,
        lon: -12.4,
        status: 'inactive',
        last_profile: '2024-01-10T08:20:00Z',
        temperature: 16.8,
        salinity: 35.9,
        oxygen: 5.9,
        platform_type: 'APEX',
        cycle_number: 156
      },
      {
        id: 'WMO_6901237',
        wmo_id: '6901237',
        lat: 31.2,
        lon: -18.6,
        status: 'active',
        last_profile: '2024-01-15T12:15:00Z',
        temperature: 20.1,
        salinity: 36.3,
        oxygen: 7.1,
        platform_type: 'SOLO',
        cycle_number: 298
      },
      {
        id: 'WMO_6901238',
        wmo_id: '6901238',
        lat: 45.3,
        lon: -5.1,
        status: 'active',
        last_profile: '2024-01-15T09:00:00Z',
        temperature: 13.8,
        salinity: 35.6,
        oxygen: 6.5,
        platform_type: 'APEX',
        cycle_number: 201
      }
    ];
  }

  private getMockProfile(): ProfileData {
    return {
      depth: [0, 10, 20, 50, 100, 200, 500, 1000, 1500, 2000],
      temperature: [18.4, 18.1, 17.8, 16.5, 14.2, 11.8, 7.3, 4.1, 2.8, 2.1],
      salinity: [36.1, 36.2, 36.1, 35.9, 35.7, 35.4, 34.9, 34.7, 34.6, 34.6],
      oxygen: [6.8, 6.7, 6.5, 6.2, 5.8, 5.1, 3.9, 2.8, 2.1, 1.8],
      pressure: [0, 1, 2, 5, 10, 20, 50, 100, 150, 200]
    };
  }

  private getMockChatResponse(query: string): ChatResponse {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('temperature') || lowerQuery.includes('warm')) {
      return {
        text: "Based on current ARGO data, I can see temperature variations across different regions. The average sea surface temperature is around 16.8°C, with warmer waters (20°C+) found in subtropical regions and cooler waters (13-15°C) in northern latitudes. Would you like me to show specific temperature profiles for any region?",
        data: { type: 'temperature_summary' }
      };
    }
    
    if (lowerQuery.includes('salinity') || lowerQuery.includes('salt')) {
      return {
        text: "Salinity measurements from ARGO floats show typical oceanic values ranging from 34.6 to 36.3 PSU (Practical Salinity Units). Higher salinity is often found in subtropical regions due to evaporation, while lower salinity occurs near river outflows and polar regions. The global average is approximately 35.9 PSU.",
        data: { type: 'salinity_summary' }
      };
    }
    
    if (lowerQuery.includes('oxygen') || lowerQuery.includes('o2')) {
      return {
        text: "Dissolved oxygen levels vary significantly with depth and location. Surface waters typically show 6-7 ml/L, decreasing to 2-3 ml/L at deeper levels. This creates oxygen minimum zones that are crucial for marine ecosystems and carbon cycling.",
        data: { type: 'oxygen_summary' }
      };
    }
    
    if (lowerQuery.includes('float') || lowerQuery.includes('location')) {
      return {
        text: "Currently tracking 3,847 active ARGO floats worldwide. These autonomous instruments collect temperature, salinity, and pressure data from the surface to 2000m depth every 10 days. Would you like to see floats in a specific region?",
        floats: this.getMockFloats()
      };
    }
    
    return {
      text: "I'm Nerida, your AI oceanographer! I can help you explore ARGO float data including temperature, salinity, and oxygen measurements. Try asking me about ocean conditions, specific regions, or float locations. What would you like to discover about our oceans?",
      data: { type: 'general_help' }
    };
  }
}

export const argoApi = new ArgoApiService();