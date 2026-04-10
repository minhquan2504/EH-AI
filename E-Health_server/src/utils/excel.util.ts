import * as ExcelJS from 'exceljs';

export interface ExcelColumn {
    header: string;
    key: string;
    width?: number;
}

export class ExcelUtil {
    /**
     * Generate Excel Buffer from data array
     */
    static async generateExcelBuffer(data: any[], columns: ExcelColumn[], sheetName = 'Sheet 1'): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'E-Health System';
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet(sheetName, {
            views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
        });

        worksheet.columns = columns;

        // Định dạng Header
        worksheet.getRow(1).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0070C0' }
        };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

        worksheet.addRows(data);

        // Thêm viền (Border) cho các ô có dữ liệu
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            row.eachCell({ includeEmpty: false }, (cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                if (rowNumber > 1) {
                    cell.alignment = { vertical: 'middle', wrapText: true };
                }
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        return buffer as unknown as Buffer;
    }

    /**
     * Parse Excel Buffer to Array of objects
     */
    static async parseExcelBuffer<T>(buffer: Buffer, columnMapping: Record<string, string>): Promise<T[]> {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer as any);

        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
            throw new Error('File Excel không có sheet nào.');
        }

        const headers: { [key: number]: string } = {};
        const data: T[] = [];

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) {
                // Đọc Header mapping
                row.eachCell((cell, colNumber) => {
                    const headerText = cell.text ? cell.text.trim() : '';
                    if (columnMapping[headerText]) {
                        headers[colNumber] = columnMapping[headerText];
                    }
                });
            } else {
                // Đọc dòng data
                const rowData: any = { _row: rowNumber };
                let hasData = false;

                row.eachCell((cell, colNumber) => {
                    if (headers[colNumber]) {
                        let value = cell.value;
                        if (value !== null && typeof value === 'object' && 'text' in value) {
                            value = value.text;
                        }

                        // Trim chuỗi
                        if (typeof value === 'string') {
                            value = value.trim();
                        }

                        rowData[headers[colNumber]] = value;
                        if (value !== null && value !== undefined && value !== '') {
                            hasData = true;
                        }
                    }
                });

                if (hasData) {
                    data.push(rowData as T);
                }
            }
        });

        return data;
    }
}
