import {
  TextractClient,
  AnalyzeDocumentCommand,
  AnalyzeIDCommand,
} from '@aws-sdk/client-textract';
import { AWS_CONFIG } from './config';

const textractClient = new TextractClient(AWS_CONFIG);

export interface OCRResult {
  fields: Record<string, string>;
  confidence: number;
  rawData: any;
}

export interface MRZData {
  documentType: string;
  documentNumber: string;
  dateOfBirth: string;
  dateOfExpiry: string;
  nationality: string;
  firstName: string;
  lastName: string;
  sex: string;
}

export async function analyzeDocument(s3Bucket: string, s3Key: string): Promise<OCRResult> {
  try {
    const command = new AnalyzeDocumentCommand({
      Document: {
        S3Object: {
          Bucket: s3Bucket,
          Name: s3Key,
        },
      },
      FeatureTypes: ['FORMS', 'TABLES'],
    });

    const response = await textractClient.send(command);

    const fields: Record<string, string> = {};
    let totalConfidence = 0;
    let fieldCount = 0;

    // Extract key-value pairs
    if (response.Blocks) {
      const keyMap = new Map();
      const valueMap = new Map();
      const blockMap = new Map();

      response.Blocks.forEach(block => {
        blockMap.set(block.Id, block);
        if (block.BlockType === 'KEY_VALUE_SET') {
          if (block.EntityTypes?.includes('KEY')) {
            keyMap.set(block.Id, block);
          } else if (block.EntityTypes?.includes('VALUE')) {
            valueMap.set(block.Id, block);
          }
        }
      });

      keyMap.forEach((keyBlock, keyId) => {
        const valueBlock = keyBlock.Relationships?.find(
          (rel: any) => rel.Type === 'VALUE'
        )?.Ids?.[0];

        if (valueBlock) {
          const key = extractText(keyBlock, blockMap);
          const value = extractText(valueMap.get(valueBlock), blockMap);

          if (key && value) {
            fields[key] = value;
            totalConfidence += (keyBlock.Confidence || 0);
            fieldCount++;
          }
        }
      });
    }

    return {
      fields,
      confidence: fieldCount > 0 ? totalConfidence / fieldCount : 0,
      rawData: response,
    };
  } catch (error) {
    console.error('Textract analysis error:', error);
    throw new Error(`Failed to analyze document: ${error}`);
  }
}

export async function analyzeID(s3Bucket: string, s3Key: string): Promise<{
  personalInfo: Record<string, any>;
  mrzData: Partial<MRZData> | null;
  confidence: number;
}> {
  try {
    // First, try AnalyzeID (works for passports and some IDs)
    const command = new AnalyzeIDCommand({
      DocumentPages: [{
        S3Object: {
          Bucket: s3Bucket,
          Name: s3Key,
        },
      }],
    });

    const response = await textractClient.send(command);

    const personalInfo: Record<string, any> = {};
    let mrzData: Partial<MRZData> | null = null;
    let totalConfidence = 0;
    let fieldCount = 0;

    if (response.IdentityDocuments && response.IdentityDocuments.length > 0) {
      const doc = response.IdentityDocuments[0];

      doc.IdentityDocumentFields?.forEach(field => {
        const fieldType = field.Type?.Text || '';
        const fieldValue = field.ValueDetection?.Text || '';
        const confidence = field.ValueDetection?.Confidence || 0;

        personalInfo[fieldType] = {
          value: fieldValue,
          confidence,
        };

        totalConfidence += confidence;
        fieldCount++;

        // Extract MRZ data
        if (fieldType === 'DOCUMENT_NUMBER') mrzData = { ...mrzData, documentNumber: fieldValue };
        if (fieldType === 'DATE_OF_BIRTH') mrzData = { ...mrzData, dateOfBirth: fieldValue };
        if (fieldType === 'EXPIRATION_DATE') mrzData = { ...mrzData, dateOfExpiry: fieldValue };
        if (fieldType === 'FIRST_NAME') mrzData = { ...mrzData, firstName: fieldValue };
        if (fieldType === 'LAST_NAME') mrzData = { ...mrzData, lastName: fieldValue };
        if (fieldType === 'NATIONALITY') mrzData = { ...mrzData, nationality: fieldValue };
        if (fieldType === 'SEX') mrzData = { ...mrzData, sex: fieldValue };
      });
    }

    // Count fields with actual values (not empty strings)
    const fieldsWithValues = Object.values(personalInfo).filter(field =>
      field && field.value && field.value.trim() !== ''
    ).length;

    console.log(`AnalyzeID found ${fieldCount} fields, but only ${fieldsWithValues} have values`);

    // If AnalyzeID found less than 3 fields with actual values, try fallback to AnalyzeDocument
    if (fieldsWithValues < 3) {
      console.log('AnalyzeID found few valid fields, trying AnalyzeDocument fallback...');
      const fallbackResult = await analyzeDocumentFallback(s3Bucket, s3Key);

      // Count fields with values in fallback result
      const fallbackFieldsWithValues = Object.values(fallbackResult.personalInfo).filter(field =>
        field && field.value && field.value.trim() !== ''
      ).length;

      console.log(`AnalyzeDocument fallback found ${fallbackFieldsWithValues} fields with values`);

      // Prefer AnalyzeDocument if it found more valid data
      if (fallbackFieldsWithValues > fieldsWithValues) {
        console.log('Using AnalyzeDocument fallback result');
        return fallbackResult;
      }
    }

    return {
      personalInfo,
      mrzData: mrzData && Object.keys(mrzData).length > 0 ? mrzData : null,
      confidence: fieldCount > 0 ? totalConfidence / fieldCount : 0,
    };
  } catch (error) {
    console.error('ID analysis error, trying fallback:', error);
    // If AnalyzeID fails, try AnalyzeDocument
    return await analyzeDocumentFallback(s3Bucket, s3Key);
  }
}

async function analyzeDocumentFallback(s3Bucket: string, s3Key: string): Promise<{
  personalInfo: Record<string, any>;
  mrzData: Partial<MRZData> | null;
  confidence: number;
}> {
  try {
    const command = new AnalyzeDocumentCommand({
      Document: {
        S3Object: {
          Bucket: s3Bucket,
          Name: s3Key,
        },
      },
      FeatureTypes: ['FORMS', 'TABLES'],
    });

    const response = await textractClient.send(command);

    const personalInfo: Record<string, any> = {};
    let totalConfidence = 0;
    let fieldCount = 0;

    // Extract all text and key-value pairs
    if (response.Blocks) {
      const keyMap = new Map();
      const valueMap = new Map();
      const blockMap = new Map();
      let allText = '';

      response.Blocks.forEach(block => {
        blockMap.set(block.Id, block);

        // Collect all text
        if (block.BlockType === 'LINE' && block.Text) {
          allText += block.Text + '\n';
        }

        if (block.BlockType === 'KEY_VALUE_SET') {
          if (block.EntityTypes?.includes('KEY')) {
            keyMap.set(block.Id, block);
          } else if (block.EntityTypes?.includes('VALUE')) {
            valueMap.set(block.Id, block);
          }
        }
      });

      // Extract key-value pairs
      keyMap.forEach((keyBlock, keyId) => {
        const valueBlock = keyBlock.Relationships?.find(
          (rel: any) => rel.Type === 'VALUE'
        )?.Ids?.[0];

        if (valueBlock) {
          const key = extractText(keyBlock, blockMap);
          const value = extractText(valueMap.get(valueBlock), blockMap);

          if (key && value) {
            // Map common field names to standard format
            const normalizedKey = normalizeFieldName(key);
            personalInfo[normalizedKey] = {
              value,
              confidence: keyBlock.Confidence || 0,
            };
            totalConfidence += (keyBlock.Confidence || 0);
            fieldCount++;
          }
        }
      });

      // Try to extract MRZ from all text
      const mrzMatch = allText.match(/([A-Z0-9<]{30,})/g);
      if (mrzMatch && mrzMatch.length >= 2) {
        personalInfo['MRZ_CODE'] = {
          value: mrzMatch.join('\n'),
          confidence: 95,
        };
      }
    }

    return {
      personalInfo,
      mrzData: null,
      confidence: fieldCount > 0 ? totalConfidence / fieldCount : 0,
    };
  } catch (error) {
    console.error('Document fallback analysis error:', error);
    throw new Error(`Failed to analyze document: ${error}`);
  }
}

function normalizeFieldName(key: string): string {
  const normalized = key.toUpperCase().trim();

  // Map common variations (including Kazakh/Russian fields)
  const mappings: Record<string, string> = {
    // English
    'NAME': 'FIRST_NAME',
    'SURNAME': 'LAST_NAME',
    'FAMILY NAME': 'LAST_NAME',
    'GIVEN NAME': 'FIRST_NAME',
    'DATE OF BIRTH': 'DATE_OF_BIRTH',
    'DOB': 'DATE_OF_BIRTH',
    'BIRTH DATE': 'DATE_OF_BIRTH',
    'ID NUMBER': 'DOCUMENT_NUMBER',
    'DOCUMENT NO': 'DOCUMENT_NUMBER',
    'LICENSE NUMBER': 'DOCUMENT_NUMBER',
    'ID NO': 'DOCUMENT_NUMBER',
    'NATIONALITY': 'NATIONALITY',
    'CITIZEN': 'NATIONALITY',
    'CITIZENSHIP': 'NATIONALITY',
    'SEX': 'SEX',
    'GENDER': 'SEX',
    'EXPIRY DATE': 'EXPIRATION_DATE',
    'EXPIRATION': 'EXPIRATION_DATE',
    'VALID UNTIL': 'EXPIRATION_DATE',
    'ADDRESS': 'ADDRESS',
    'PLACE OF BIRTH': 'PLACE_OF_BIRTH',

    // Kazakh/Russian (Kazakhstan ID)
    'АТЫ/ИМЯ': 'FIRST_NAME',
    'ИМЯ': 'FIRST_NAME',
    'ТЕГІ/ФАМИЛИЯ': 'LAST_NAME',
    'ФАМИЛИЯ': 'LAST_NAME',
    'ӘКЕСІНІҢ АТЫ / ОТЧЕСТВО': 'MIDDLE_NAME',
    'ӘКЕСІНІН АТЫ / ОТЧЕСТВО': 'MIDDLE_NAME',
    'ОТЧЕСТВО': 'MIDDLE_NAME',
    'ТУҒАН КҮНІ/ДАТА РОЖДЕНИЯ': 'DATE_OF_BIRTH',
    'ТУРАН КҮНӀ/ДАТА РОЖДЕНИЯ': 'DATE_OF_BIRTH',
    'ДАТА РОЖДЕНИЯ': 'DATE_OF_BIRTH',
    'ЖСН / ИИН': 'DOCUMENT_NUMBER',
    'ИИН': 'DOCUMENT_NUMBER',
    'ЖСН': 'DOCUMENT_NUMBER',
    'АЗАМАТТЫҒЫ/ГРАЖДАНСТВО': 'NATIONALITY',
    'ГРАЖДАНСТВО': 'NATIONALITY',
    'ЖЫНЫСЫ/ПОЛ': 'SEX',
    'ПОЛ': 'SEX',

    // Russian (Russia passport/ID)
    'ФАМИЛИЯ / SURNAME': 'LAST_NAME',
    'ИМЯ / NAME': 'FIRST_NAME',
    'ОТЧЕСТВО / PATRONYMIC': 'MIDDLE_NAME',
    'ДАТА РОЖДЕНИЯ / DATE OF BIRTH': 'DATE_OF_BIRTH',
    'МЕСТО РОЖДЕНИЯ': 'PLACE_OF_BIRTH',
    'НОМЕР ДОКУМЕНТА': 'DOCUMENT_NUMBER',
  };

  return mappings[normalized] || normalized;
}

function extractText(block: any, blockMap: Map<string, any>): string {
  if (!block) return '';

  let text = '';
  if (block.Relationships) {
    block.Relationships.forEach((relationship: any) => {
      if (relationship.Type === 'CHILD') {
        relationship.Ids.forEach((childId: string) => {
          const childBlock = blockMap.get(childId);
          if (childBlock && childBlock.BlockType === 'WORD') {
            text += childBlock.Text + ' ';
          }
        });
      }
    });
  }

  return text.trim();
}
