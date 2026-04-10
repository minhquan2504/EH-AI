export class ApiMatcherUtil {
    /**
     * So khớp một URL thực tế với một Route Pattern
     */
    static isMatch(actualPath: string, routePattern: string): boolean {
        const regexPattern = routePattern
            .replace(/\/:[^/]+/g, '/([^/]+)')

        const regex = new RegExp(`^${regexPattern}$`, 'i');

        const cleanPath = actualPath.split('?')[0];

        return regex.test(cleanPath);
    }
}
