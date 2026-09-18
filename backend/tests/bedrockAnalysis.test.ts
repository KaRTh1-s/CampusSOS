import { BedrockAnalysisService } from '../src/services/bedrockAnalysisService.js';

// We will test BedrockAnalysisService without making a real AWS call.
// We can mock the internal client or prototype send.

async function runTests() {
  console.log('--- Starting BedrockAnalysisService Tests ---');

  // Override config
  process.env.AWS_REGION = 'ap-south-1';
  process.env.BEDROCK_MODEL_ID = 'test-model';

  const service = new BedrockAnalysisService();

  // Hacky mock of the client send for unit testing without a mock library
  const originalSend = (service as any).client.send.bind((service as any).client);

  let mockResponse: any;

  (service as any).client.send = async () => {
    if (mockResponse instanceof Error) {
      throw mockResponse;
    }
    return {
      body: new TextEncoder().encode(JSON.stringify(mockResponse))
    };
  };

  try {
    console.log('1. Testing successful valid JSON response...');
    mockResponse = {
      content: [
        {
          text: `
Here is the JSON you requested:
{
  "category": "Electrical Safety",
  "priority": "CRITICAL",
  "summary": "Exposed wire in lab.",
  "recommendedAction": "Evacuate",
  "department": "Safety"
}
          `
        }
      ]
    };

    const res1 = await service.analyze('test');
    if (res1.category !== 'Electrical Safety' || res1.priority !== 'CRITICAL') {
      throw new Error('Valid JSON parsing failed');
    }
    console.log('✅ Success: valid JSON parsed with markdown surrounding');

    console.log('2. Testing missing required fields...');
    mockResponse = {
      content: [
        {
          text: `{"category": "test"}` // missing others
        }
      ]
    };
    try {
      await service.analyze('test');
      throw new Error('Should have failed validation');
    } catch (err: any) {
      if (err.message !== 'AI analysis failed due to an internal error.') {
        throw new Error(`Wrong error message: ${err.message}`);
      }
      console.log('✅ Success: missing fields caught');
    }

    console.log('3. Testing invalid priority fallback...');
    mockResponse = {
      content: [
        {
          text: `{"category": "test", "priority": "SUPER_HIGH", "summary": "s", "recommendedAction": "r", "department": "d"}`
        }
      ]
    };
    const res3 = await service.analyze('test');
    if (res3.priority !== 'MEDIUM') {
      throw new Error('Invalid priority should fallback to MEDIUM');
    }
    console.log('✅ Success: invalid priority gracefully degraded to MEDIUM');

    console.log('4. Testing ThrottlingException translation...');
    mockResponse = new Error('Throttling');
    mockResponse.name = 'ThrottlingException';
    
    try {
      await service.analyze('test');
      throw new Error('Should have thrown');
    } catch (err: any) {
      if (!err.message.includes('overloaded')) {
        throw new Error('Did not translate throttling exception');
      }
      console.log('✅ Success: ThrottlingException translated');
    }

    console.log('5. Testing AccessDeniedException translation...');
    mockResponse = new Error('Access Denied');
    mockResponse.name = 'AccessDeniedException';
    
    try {
      await service.analyze('test');
      throw new Error('Should have thrown');
    } catch (err: any) {
      if (!err.message.includes('Account verification pending')) {
        throw new Error('Did not translate AccessDenied exception');
      }
      console.log('✅ Success: AccessDeniedException translated');
    }

    console.log('--- All BedrockAnalysisService tests passed! ---');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    // Restore
    (service as any).client.send = originalSend;
  }
}

runTests();
