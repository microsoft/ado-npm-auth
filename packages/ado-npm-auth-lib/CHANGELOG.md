# Change Log - @microsoft/ado-npm-auth-lib

<!-- This log was last generated on Wed, 17 Dec 2025 23:18:54 GMT and should not be manually modified. -->

<!-- Start content -->

## 0.9.0

Wed, 17 Dec 2025 23:18:54 GMT

### Minor changes

- Factor out library from the cli bundle (dannyvv@microsoft.com)

## 0.8.0

Sun, 16 Nov 2025 00:12:40 GMT

### Minor changes

- Fix release pipeline (dannyvv@microsoft.com)

## 0.7.0

Fri, 14 Nov 2025 19:10:12 GMT

### Minor changes

- Use vso.packaging_write permission to support pulling in packages from Azure DevOps upstream feeds (dannyvv@microsoft.com)
- Switch from pnpm to yarn v4 (dannyvv@microsoft.com)
- Version bump (dannyvv@microsoft.com)

### Patches

- ship loose .js files to allow tree shaking, enable eslint support with fixes to increase strictness (jasonmo@microsoft.com)
- fix: add missing output and remove redundant url in organization (matanbobi@gmail.com)

## 0.6.0

Thu, 16 Oct 2025 22:56:01 GMT

### Minor changes

- Add new flag to return a specific exit code when authentication ran (dannyvv@microsoft.com)
- Make file writes only when required (dannyvv@microsoft.com)
- Fix #79: Remove erroneously added `m` for minutes in the timeout configuration. (dannyvv@microsoft.com)
- Add authentication support for Linux (dannyvv@microsoft.com)

### Patches

- Fix exit code check in WSL environments (mantiquillal@gmail.com)
- Update bundled devDependencies (elcraig@microsoft.com)

## 0.3.2

Fri, 27 Dec 2024 22:13:14 GMT

### Patches

- Bump @npmcli/config to 10.0.0 to fix #52 (dannyvv@microsoft.com)
- Add support to pass an override for azureAuthLocation on the commandline (dsfsdf@microsoft.com)
- Allow non azure devops feeds to be present in the configuration. (dannyvv@microsoft.com)

## 0.3.1

Wed, 30 Oct 2024 20:31:48 GMT

### Patches

- Bump azureauth to v0.12.1

## 0.3.0

Tue, 08 Oct 2024 17:07:15 GMT

### Minor changes

- Ensure all types are included in the package (dannyvv@microsoft.com)

## 0.2.0

Mon, 07 Oct 2024 17:28:12 GMT

### Minor changes

- Expose functionality as a library (dannyvv@microsoft.com)
- Bump azureauth to v0.12.0

## 0.1.11

Fri, 13 Sep 2024 19:47:53 GMT

### Patches

- Bump azureauth to v0.11.0

## 0.1.10

Fri, 13 Sep 2024 18:59:07 GMT

### Patches

- Bump azureauth to v0.10.0

## 0.1.9

Fri, 13 Sep 2024 18:42:55 GMT

### Patches

- Bump azureauth to v0.9.0

## 0.1.8

Fri, 13 Sep 2024 18:15:05 GMT

### Patches

- Bump azureauth to v0.8.0

## 0.1.7

Fri, 13 Sep 2024 17:50:14 GMT

### Patches

- Bump azureauth to v0.7.0

## 0.1.6

Thu, 12 Sep 2024 21:56:08 GMT

### Patches

- Bump azureauth to v0.6.0

## 0.1.5

Wed, 11 Sep 2024 20:04:18 GMT

### Patches

- Linting fixes (dannyvv@microsoft.com)
- Bump azureauth to v0.5.1

## 0.1.4

Wed, 11 Sep 2024 16:57:41 GMT

### Patches

- Make ado-npm-auth use bundles to avoid pulling in a bunch of packages for a build tool (dannyvv@microsoft.com)
- Bump azureauth to v0.5.0

## 0.1.3

Mon, 09 Sep 2024 17:27:01 GMT

### Patches

- Initial official release (dannyvv@microsoft.com)
- Bump azureauth to v0.4.7
