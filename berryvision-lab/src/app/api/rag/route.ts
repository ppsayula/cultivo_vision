// BerryVision AI - RAG API Endpoint
import { NextRequest, NextResponse } from 'next/server';
import {
  generateRAGResponse,
  searchKnowledge,
  enhanceAnalysisWithKnowledge,
  analyzeImageWithRAG,
} from '@/lib/rag';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'query': {
        // General knowledge query
        const { question, context } = params;
        if (!question) {
          return NextResponse.json(
            { error: 'Question is required' },
            { status: 400 }
          );
        }

        const response = await generateRAGResponse(question, context);
        return NextResponse.json(response);
      }

      case 'search': {
        // Search knowledge base
        const { query, options } = params;
        if (!query) {
          return NextResponse.json(
            { error: 'Query is required' },
            { status: 400 }
          );
        }

        const documents = await searchKnowledge(query, options);
        return NextResponse.json({ documents });
      }

      case 'enhance': {
        // Enhance analysis with knowledge
        const { analysisResult, cropType } = params;
        if (!analysisResult || !cropType) {
          return NextResponse.json(
            { error: 'analysisResult and cropType are required' },
            { status: 400 }
          );
        }

        const enhanced = await enhanceAnalysisWithKnowledge(
          analysisResult,
          cropType
        );
        return NextResponse.json(enhanced);
      }

      case 'analyze-image': {
        // Analyze image with GPT-4 Vision + RAG
        const { image, cropType, additionalContext } = params;
        if (!image) {
          return NextResponse.json(
            { error: 'image (base64) is required' },
            { status: 400 }
          );
        }

        const result = await analyzeImageWithRAG(
          image,
          cropType || 'blueberry',
          additionalContext
        );
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: query, search, enhance, or analyze-image' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('RAG API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for simple queries
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter "q" is required' },
      { status: 400 }
    );
  }

  try {
    const response = await generateRAGResponse(query);
    return NextResponse.json(response);
  } catch (error) {
    console.error('RAG API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
