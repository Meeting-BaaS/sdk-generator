# Automated SDK Setup Guide

This guide explains how to set up the automated SDK update workflow for Meeting BaaS SDK.

## 🚀 Overview

The automated workflow will:

- Check for API changes daily
- Regenerate the SDK when changes are detected
- Test across multiple Node.js versions (18, 19, 20, 21, 22)
- Auto-publish to npm when tests pass

## 📋 Prerequisites

1. **GitHub Repository**: SDK must be in a GitHub repository
2. **npm Package**: The package must be published to npm
3. **GitHub Secrets**: Required secrets must be configured
4. **Node.js Support**: GitHub Actions supports Node.js versions 18, 19, 20, 21, and 22

## 🔐 Required Secrets

You need to configure these secrets in your GitHub repository:

### 1. NPM_TOKEN

**Purpose**: Allows the workflow to publish to npm

**How to get it**:

1. Go to [npmjs.com](https://www.npmjs.com)
2. Log in to your account
3. Go to your profile → Access Tokens
4. Create a new token with "Automation" type
5. Copy the token

**How to set it**:

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `NPM_TOKEN`
5. Value: Your npm token

### 2. GITHUB_TOKEN (Optional)

**Purpose**: Allows the workflow to create releases and push commits

**Note**: This is usually automatically available, but you can create a Personal Access Token if needed.

## ⚙️ Configuration

### 1. Repository Settings

Ensure your repository has the following settings:

- **Branch Protection**: Protect the `main` branch
- **Required Status Checks**: Require the "Test SDK" workflow to pass
- **Automated Security Fixes**: Enable Dependabot alerts

### 2. Workflow Permissions

The workflows need these permissions:

```yaml
permissions:
  contents: write    # For creating releases and pushing commits
  packages: write    # For publishing to npm
  actions: read      # For reading workflow status
```

### 3. Package.json Configuration

Ensure your `package.json` has:

```json
{
  "name": "@meeting-baas/sdk",
  "version": "5.0.0",
  "publishConfig": {
    "access": "public"
  },
  "scripts": {
    "openapi:rebuild": "pnpm openapi:generate && pnpm build"
  }
}
```

## 🧪 Testing the Setup

### 1. Manual Test Run

1. Go to your repository's Actions tab
2. Select "Auto Update SDK" workflow
3. Click "Run workflow"
4. Monitor the execution

### 2. Simulate API Changes

To test the change detection:

1. Make a small change to the OpenAPI spec (if you control it)
2. Run the workflow manually
3. Verify it detects changes and regenerates the SDK

### 3. Test Publishing

To test the publishing process:

1. Make a small change to trigger an update
2. Monitor the workflow execution
3. Check that the new version is published to npm

## 🔍 Monitoring

### 1. Workflow Status

Monitor workflows in the Actions tab:

- **Auto Update SDK**: Daily automated updates
- **Test SDK**: Manual and PR testing

### 2. Notifications

Set up notifications for:

- Workflow failures
- New releases
- Security alerts

### 3. Logs

Check workflow logs for:

- API change detection
- Test results
- Publishing status

## 🛠️ Troubleshooting

### Common Issues

#### 1. NPM_TOKEN Issues

**Problem**: Publishing fails with authentication errors

**Solution**:

- Verify the NPM_TOKEN secret is set correctly
- Ensure the token has "Automation" type
- Check that the package name matches your npm account

#### 2. Permission Issues

**Problem**: Workflow can't push commits or create releases

**Solution**:

- Verify GITHUB_TOKEN permissions
- Check repository settings
- Ensure workflow has write permissions

#### 3. Test Failures

**Problem**: Tests fail on some Node versions

**Solution**:

- Review test logs for specific failures
- Update test dependencies
- Check for Node.js compatibility issues

#### 4. OpenAPI Fetch Issues

**Problem**: Can't fetch the OpenAPI specification

**Solution**:

- Verify the API endpoint is accessible
- Check network connectivity
- Review API rate limits

### Debug Mode

Enable debug logging by adding this to your workflow:

```yaml
env:
  ACTIONS_STEP_DEBUG: true
  ACTIONS_RUNNER_DEBUG: true
```

## 📊 Metrics

Track these metrics to monitor the automation:

- **Update Frequency**: How often API changes are detected
- **Test Success Rate**: Percentage of successful test runs
- **Publishing Success Rate**: Percentage of successful publishes
- **Node.js Compatibility**: Test results across different versions

## 🔄 Maintenance

### Regular Tasks

1. **Monitor Workflow Runs**: Check for failures and investigate
2. **Update Dependencies**: Keep workflow dependencies current
3. **Review Test Coverage**: Ensure comprehensive test coverage
4. **Monitor npm Package**: Check for any publishing issues

### Updates

1. **Workflow Updates**: Keep GitHub Actions up to date
2. **Node.js Versions**: Update supported Node.js versions
3. **Test Improvements**: Enhance test coverage and reliability

## 🎯 Best Practices

1. **Test Locally**: Test changes locally before pushing
2. **Incremental Updates**: Make small, focused changes
3. **Documentation**: Keep documentation up to date
4. **Monitoring**: Set up alerts for workflow failures
5. **Backup**: Keep manual publishing capability as backup

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review GitHub Actions documentation
3. Check npm publishing guidelines
4. Open an issue in the repository

## 🎉 Success Indicators

Your automation is working correctly when:

- ✅ Daily workflow runs complete successfully
- ✅ API changes are detected and processed
- ✅ New versions are published to npm
- ✅ Test coverage remains high
- ✅ No manual intervention required

This setup creates a fully automated SDK that stays current with your API changes while maintaining high quality and reliability!
