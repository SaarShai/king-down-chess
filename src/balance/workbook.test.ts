import { describe, expect, it } from 'vitest';
import { newDesigns, parseWorkbook } from './workbook';

describe('workbook source', () => {
  const files: Record<string, string> = {
    'xl/workbook.xml': '<workbook><sheets><sheet name="Piece matrix" r:id="rId1"/></sheets></workbook>',
    'xl/_rels/workbook.xml.rels': '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Target="sharedStrings.xml"/></Relationships>',
    'xl/sharedStrings.xml': '<sst><si><r><t>move </t></r><r><t>&amp; take</t></r></si></sst>',
    'xl/worksheets/sheet1.xml': '<worksheet><sheetData><row><c r="A4" t="s"><v>0</v></c><c r="B4" t="inlineStr"><is><t>step &#50;</t></is></c><c r="A5" t="inlineStr"><is><t>captures</t></is></c></row></sheetData><dataValidations><dataValidation sqref="B4"><formula1>Lists!A1:A3</formula1></dataValidation></dataValidations></worksheet>',
  };
  it('keeps shared rich text, inline values, and allowed-value sources', () => {
    const book = parseWorkbook(name => files[name], 'test.xlsx', 'test');
    expect(book.sheets[0].cells[0]).toEqual({ cell: 'A4', value: 'move & take' });
    expect(book.sheets[0].validations[0]).toEqual({ range: 'B4', formula: 'Lists!A1:A3' });
    expect(newDesigns(book)[0]).toMatchObject({ specified: 1, properties: [{ dimension: 'move & take', value: 'step 2' }, { dimension: 'captures', value: null }] });
  });
  it('rejects an external sheet reference', () => {
    expect(() => parseWorkbook(name => name.endsWith('.rels') ? files[name].replace('worksheets/sheet1.xml', 'https://example.org') : files[name], 'test', 'test')).toThrow('Invalid sheet target');
  });
});
