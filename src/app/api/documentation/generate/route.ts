import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { DocumentationGenerator, DefaultDocumentation, DocumentationUtils } from '@/lib/documentation';

export async function POST(request: NextRequest) {
  try {
    const { type, format } = await request.json();

    const generator = new DocumentationGenerator();

    // Add default API documentation
    DefaultDocumentation.apiDocs.forEach(doc => {
      generator.addAPIDocumentation(doc);
    });

    // Add default user guides
    DefaultDocumentation.userGuides.forEach(guide => {
      generator.addUserGuide(guide);
    });

    let output: string;
    let filename: string;
    let contentType: string;

    switch (type) {
      case 'markdown':
        output = generator.generateMarkdownDocumentation();
        filename = 'documentation.md';
        contentType = 'text/markdown';
        break;

      case 'api':
        output = generator.generateAPIDocumentation();
        filename = 'api-documentation.md';
        contentType = 'text/markdown';
        break;

      case 'user-guide':
        output = generator.generateUserGuide();
        filename = 'user-guide.md';
        contentType = 'text/markdown';
        break;

      case 'swagger':
        const swaggerSpec = DocumentationUtils.generateSwaggerSpec(DefaultDocumentation.apiDocs);
        output = JSON.stringify(swaggerSpec, null, 2);
        filename = 'swagger.json';
        contentType = 'application/json';
        break;

      case 'postman':
        const postmanCollection = DocumentationUtils.generatePostmanCollection(DefaultDocumentation.apiDocs);
        output = JSON.stringify(postmanCollection, null, 2);
        filename = 'postman-collection.json';
        contentType = 'application/json';
        break;

      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid documentation type. Supported types: markdown, api, user-guide, swagger, postman'
        }, { status: 400 });
    }

    return new NextResponse(output, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error('Documentation generation error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to generate documentation',
      error: error.message
    }, { status: 500 });
  }
}


