/**
 * Tests for Perplexity API utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  callPerplexityApi, 
  generateTimeInRangePrompt, 
  generateGlucoseInsulinPrompt,
  generateMealTimingPrompt,
  base64Encode, 
  base64Decode 
} from './perplexityApi';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('perplexityApi', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('base64Encode', () => {
    it('should encode a simple string to base64', () => {
      const result = base64Encode('Hello World');
      expect(result).toBe('SGVsbG8gV29ybGQ=');
    });

    it('should encode empty string', () => {
      const result = base64Encode('');
      expect(result).toBe('');
    });

    it('should encode special characters', () => {
      const result = base64Encode('Test@123!#$');
      expect(result).toBe('VGVzdEAxMjMhIyQ=');
    });

    it('should encode CSV data', () => {
      const csvData = 'Date,Day,BG\n2024-01-01,Monday,85';
      const result = base64Encode(csvData);
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('base64Decode', () => {
    it('should decode a base64 string', () => {
      const result = base64Decode('SGVsbG8gV29ybGQ=');
      expect(result).toBe('Hello World');
    });

    it('should decode empty string', () => {
      const result = base64Decode('');
      expect(result).toBe('');
    });

    it('should decode special characters', () => {
      const result = base64Decode('VGVzdEAxMjMhIyQ=');
      expect(result).toBe('Test@123!#$');
    });

    it('should encode and decode correctly (round trip)', () => {
      const original = 'Date,Day,BG\n2024-01-01,Monday,85';
      const encoded = base64Encode(original);
      const decoded = base64Decode(encoded);
      expect(decoded).toBe(original);
    });
  });

  describe('generateGlucoseInsulinPrompt', () => {
    it('should generate a prompt with decoded CSV data', () => {
      const csvData = 'Date,Day,BG\n2024-01-01,Monday,85';
      const base64Data = base64Encode(csvData);
      const prompt = generateGlucoseInsulinPrompt(base64Data);
      
      expect(prompt).toContain('Date,Day,BG');
      expect(prompt).toContain('2024-01-01,Monday,85');
      expect(prompt).toContain('Temporal Trends');
      expect(prompt).toContain('Insulin Efficacy Tiers');
      expect(prompt).toContain('Anomalies and Key Events');
      expect(prompt).toContain('Actionable Summary');
    });

    it('should include role and goal section', () => {
      const csvData = 'Date,Day\n2024-01-01,Monday';
      const base64Data = base64Encode(csvData);
      const prompt = generateGlucoseInsulinPrompt(base64Data);
      
      expect(prompt).toContain('Role and Goal');
      expect(prompt).toContain('Data Analyst and Diabetes Management Specialist');
    });

    it('should include mmol/L unit specification', () => {
      const csvData = 'Date,Day\n2024-01-01,Monday';
      const base64Data = base64Encode(csvData);
      const prompt = generateGlucoseInsulinPrompt(base64Data);
      
      expect(prompt).toContain('mmol/L');
      expect(prompt).toContain('not mg/dL');
    });

    it('should use second-person language', () => {
      const csvData = 'Date,Day\n2024-01-01,Monday';
      const base64Data = base64Encode(csvData);
      const prompt = generateGlucoseInsulinPrompt(base64Data);
      
      expect(prompt).toContain('you/your');
    });

    it('should request analysis of best and worst days', () => {
      const csvData = 'Date,Day\n2024-01-01,Monday';
      const base64Data = base64Encode(csvData);
      const prompt = generateGlucoseInsulinPrompt(base64Data);
      
      expect(prompt).toContain('3 best days');
      expect(prompt).toContain('3 worst days');
      expect(prompt).toContain('highest BG In Range');
      expect(prompt).toContain('lowest BG In Range');
    });

    it('should request tiering analysis instead of correlation', () => {
      const csvData = 'Date,Day\n2024-01-01,Monday';
      const base64Data = base64Encode(csvData);
      const prompt = generateGlucoseInsulinPrompt(base64Data);
      
      expect(prompt).toContain('Total Dose Tiering');
      expect(prompt).toContain('Low, Medium, and High Total Insulin tiers');
      expect(prompt).toContain('Bolus Ratio Impact');
      expect(prompt).toContain('Bolus-to-Total-Insulin Ratio');
      // Should NOT contain correlation language
      expect(prompt).not.toContain('correlation between Total Insulin');
    });

    it('should request insulin dose averages for best and worst days', () => {
      const csvData = 'Date,Day\n2024-01-01,Monday';
      const base64Data = base64Encode(csvData);
      const prompt = generateGlucoseInsulinPrompt(base64Data);
      
      expect(prompt).toContain('average Basal dose');
      expect(prompt).toContain('average Bolus dose');
      expect(prompt).toContain('3 best days');
      expect(prompt).toContain('3 worst days');
      expect(prompt).toContain('key difference');
    });

    it('should request actionable recommendations', () => {
      const csvData = 'Date,Day\n2024-01-01,Monday';
      const base64Data = base64Encode(csvData);
      const prompt = generateGlucoseInsulinPrompt(base64Data);
      
      expect(prompt).toContain('3-point summary');
      expect(prompt).toContain('2-3 specific, actionable recommendations');
      expect(prompt).toContain('tier and outlier data');
    });
  });

  describe('generateTimeInRangePrompt', () => {
    it('should generate a prompt with the TIR percentage', () => {
      const prompt = generateTimeInRangePrompt(65.5);
      expect(prompt).toContain('65.5%');
      expect(prompt).toContain('time-in-range');
      expect(prompt).toContain('continuous glucose monitoring');
    });

    it('should include mmol/L unit specification', () => {
      const prompt = generateTimeInRangePrompt(80);
      expect(prompt).toContain('mmol/L');
      expect(prompt).toContain('not mg/dL');
    });

    it('should use second-person language (you/your)', () => {
      const prompt = generateTimeInRangePrompt(75);
      expect(prompt).toContain('My');
      expect(prompt).toContain('you/your');
      expect(prompt).not.toContain('patient');
    });

    it('should include assessment and recommendations context', () => {
      const prompt = generateTimeInRangePrompt(80);
      expect(prompt).toContain('assessment');
      expect(prompt).toContain('recommendations');
      expect(prompt).toContain('70%');
    });

    it('should format percentage to one decimal place', () => {
      const prompt = generateTimeInRangePrompt(66.66666);
      expect(prompt).toContain('66.7%');
    });
  });

  describe('callPerplexityApi', () => {
    it('should return error if API key is empty', async () => {
      const result = await callPerplexityApi('', 'test prompt');
      expect(result.success).toBe(false);
      expect(result.error).toBe('API key is required');
      expect(result.errorType).toBe('unauthorized');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return error if prompt is empty', async () => {
      const result = await callPerplexityApi('test-key', '');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Prompt is required');
      expect(result.errorType).toBe('api');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should call Perplexity API with correct parameters', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          id: 'test-id',
          model: 'sonar',
          created: 1234567890,
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
          },
          choices: [
            {
              index: 0,
              finish_reason: 'stop',
              message: {
                role: 'assistant',
                content: 'Test response from AI',
              },
              delta: {
                role: 'assistant',
                content: '',
              },
            },
          ],
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await callPerplexityApi('test-api-key', 'test prompt');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.perplexity.ai/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result.success).toBe(true);
      expect(result.content).toBe('Test response from AI');
    });

    it('should handle 401 unauthorized error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({
          error: {
            message: 'Invalid API key',
            type: 'invalid_request_error',
          },
        }),
      });

      const result = await callPerplexityApi('invalid-key', 'test prompt');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid API key');
      expect(result.errorType).toBe('unauthorized');
    });

    it('should handle 403 forbidden error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({
          error: {
            message: 'Access denied',
            type: 'permission_error',
          },
        }),
      });

      const result = await callPerplexityApi('test-key', 'test prompt');

      expect(result.success).toBe(false);
      expect(result.errorType).toBe('unauthorized');
    });

    it('should handle API error with error message', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({
          error: {
            message: 'Server error occurred',
            type: 'server_error',
          },
        }),
      });

      const result = await callPerplexityApi('test-key', 'test prompt');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Server error occurred');
      expect(result.errorType).toBe('api');
    });

    it('should handle API error without JSON body', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const result = await callPerplexityApi('test-key', 'test prompt');

      expect(result.success).toBe(false);
      expect(result.error).toContain('500');
      expect(result.errorType).toBe('api');
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

      const result = await callPerplexityApi('test-key', 'test prompt');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
      expect(result.errorType).toBe('network');
    });

    it('should handle unknown errors', async () => {
      mockFetch.mockRejectedValue(new Error('Unknown error'));

      const result = await callPerplexityApi('test-key', 'test prompt');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown error');
      expect(result.errorType).toBe('unknown');
    });

    it('should handle invalid response format', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'test-id',
          choices: [],
        }),
      });

      const result = await callPerplexityApi('test-key', 'test prompt');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid response format');
      expect(result.errorType).toBe('api');
    });

    it('should trim whitespace from AI response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              index: 0,
              finish_reason: 'stop',
              message: {
                role: 'assistant',
                content: '  \n  Test response with whitespace  \n  ',
              },
              delta: {
                role: 'assistant',
                content: '',
              },
            },
          ],
        }),
      });

      const result = await callPerplexityApi('test-key', 'test prompt');

      expect(result.success).toBe(true);
      expect(result.content).toBe('Test response with whitespace');
    });

    it('should include system message in API request', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'Response',
              },
              delta: { role: 'assistant', content: '' },
            },
          ],
        }),
      });

      await callPerplexityApi('test-key', 'test prompt');

      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      
      expect(body.messages).toHaveLength(2);
      expect(body.messages[0].role).toBe('system');
      expect(body.messages[0].content).toContain('medical assistant');
      expect(body.messages[0].content).toContain('mmol/L');
      expect(body.messages[0].content).toContain('second person');
      expect(body.messages[1].role).toBe('user');
      expect(body.messages[1].content).toBe('test prompt');
    });

    it('should use correct model and parameters', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'Response',
              },
              delta: { role: 'assistant', content: '' },
            },
          ],
        }),
      });

      await callPerplexityApi('test-key', 'test prompt');

      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      
      expect(body.model).toBe('sonar');
      expect(body.temperature).toBe(0.2);
      expect(body.max_tokens).toBe(1000);
    });
  });

  describe('generateMealTimingPrompt', () => {
    it('should generate a valid prompt with all three datasets', () => {
      const cgmData = 'Timestamp,CGM Glucose Value (mmol/L)\n2024-01-01T08:00:00Z,6.5\n2024-01-01T08:05:00Z,7.2';
      const bolusData = 'Timestamp,Insulin Delivered (U)\n2024-01-01T08:00:00Z,5.0\n2024-01-01T12:00:00Z,6.5';
      const basalData = 'Timestamp,Insulin Delivered (U)\n2024-01-01T00:00:00Z,1.0\n2024-01-01T01:00:00Z,1.2';
      
      const base64Cgm = base64Encode(cgmData);
      const base64Bolus = base64Encode(bolusData);
      const base64Basal = base64Encode(basalData);
      
      const prompt = generateMealTimingPrompt(base64Cgm, base64Bolus, base64Basal);
      
      expect(prompt).toBeTruthy();
      expect(prompt).toContain('Role and Goal');
      expect(prompt).toContain('Data Analyst and Diabetes Management Specialist');
      expect(prompt).toContain('mmol/L');
      expect(prompt).toContain('you/your');
      expect(prompt).toContain('Dataset 1: CGM Data');
      expect(prompt).toContain('Dataset 2: Bolus Data');
      expect(prompt).toContain('Dataset 3: Basal Data');
      expect(prompt).toContain(cgmData);
      expect(prompt).toContain(bolusData);
      expect(prompt).toContain(basalData);
    });

    it('should include all required analysis sections', () => {
      const cgmData = 'Timestamp,CGM Glucose Value (mmol/L)\n2024-01-01T08:00:00Z,6.5';
      const bolusData = 'Timestamp,Insulin Delivered (U)\n2024-01-01T08:00:00Z,5.0';
      const basalData = 'Timestamp,Insulin Delivered (U)\n2024-01-01T00:00:00Z,1.0';
      
      const prompt = generateMealTimingPrompt(
        base64Encode(cgmData),
        base64Encode(bolusData),
        base64Encode(basalData)
      );
      
      expect(prompt).toContain('Temporal Trends');
      expect(prompt).toContain('Insulin Efficacy Tiering');
      expect(prompt).toContain('Post-Meal Timing Efficacy');
      expect(prompt).toContain('Nocturnal Basal Efficacy');
      expect(prompt).toContain('Actionable Summary and Recommendations');
      expect(prompt).toContain('3-Point Summary');
    });

    it('should include specific analysis requirements', () => {
      const cgmData = 'Timestamp,CGM Glucose Value (mmol/L)\n2024-01-01T08:00:00Z,6.5';
      const bolusData = 'Timestamp,Insulin Delivered (U)\n2024-01-01T08:00:00Z,5.0';
      const basalData = 'Timestamp,Insulin Delivered (U)\n2024-01-01T00:00:00Z,1.0';
      
      const prompt = generateMealTimingPrompt(
        base64Encode(cgmData),
        base64Encode(bolusData),
        base64Encode(basalData)
      );
      
      expect(prompt).toContain('BG Control Ranking');
      expect(prompt).toContain('Workdays (Mon-Fri)');
      expect(prompt).toContain('Weekends (Sat-Sun)');
      expect(prompt).toContain('Low, Medium, and High Total Daily Insulin');
      expect(prompt).toContain('Breakfast, Lunch, and Dinner');
      expect(prompt).toContain('Spike Rate');
      expect(prompt).toContain('Time to Peak BG');
      expect(prompt).toContain('Dawn Phenomenon');
      expect(prompt).toContain('03:00 AM');
    });

    it('should decode base64 data correctly in the prompt', () => {
      const cgmData = 'Test CGM Data';
      const bolusData = 'Test Bolus Data';
      const basalData = 'Test Basal Data';
      
      const prompt = generateMealTimingPrompt(
        base64Encode(cgmData),
        base64Encode(bolusData),
        base64Encode(basalData)
      );
      
      expect(prompt).toContain(cgmData);
      expect(prompt).toContain(bolusData);
      expect(prompt).toContain(basalData);
    });

    it('should use mmol/L units consistently', () => {
      const cgmData = 'Timestamp,CGM Glucose Value (mmol/L)\n2024-01-01T08:00:00Z,6.5';
      const bolusData = 'Timestamp,Insulin Delivered (U)\n2024-01-01T08:00:00Z,5.0';
      const basalData = 'Timestamp,Insulin Delivered (U)\n2024-01-01T00:00:00Z,1.0';
      
      const prompt = generateMealTimingPrompt(
        base64Encode(cgmData),
        base64Encode(bolusData),
        base64Encode(basalData)
      );
      
      expect(prompt).toContain('mmol/L');
      expect(prompt).toContain('not mg/dL'); // Contains warning about not using mg/dL
      expect(prompt).toContain('3.9-10.0 mmol/L');
    });

    it('should use second person language', () => {
      const cgmData = 'Timestamp,CGM Glucose Value (mmol/L)\n2024-01-01T08:00:00Z,6.5';
      const bolusData = 'Timestamp,Insulin Delivered (U)\n2024-01-01T08:00:00Z,5.0';
      const basalData = 'Timestamp,Insulin Delivered (U)\n2024-01-01T00:00:00Z,1.0';
      
      const prompt = generateMealTimingPrompt(
        base64Encode(cgmData),
        base64Encode(bolusData),
        base64Encode(basalData)
      );
      
      expect(prompt).toContain('you/your');
    });
  });
});
