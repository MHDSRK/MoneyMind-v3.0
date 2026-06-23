# Testing Guide - MoneyMind

## Overview

MoneyMind includes a comprehensive test suite for financial calculations, ensuring accuracy and reliability of core business logic.

## Running Tests

### Run all tests
```bash
npm run test
```

### Run tests in watch mode (auto-rerun on changes)
```bash
npm run test -- --watch
```

### Run tests with UI dashboard
```bash
npm run test:ui
```

### Run tests with coverage report
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm run test -- calculations.test.ts
```

### Run tests matching a pattern
```bash
npm run test -- --grep "Loan"
```

## Test Structure

Tests are located in `src/lib/__tests__/` and organized by module:

```
src/lib/__tests__/
├── calculations.test.ts      # Financial metrics calculations
├── loanCalculations.test.ts   # EMI and amortization logic
└── [future test files]
```

## Test Coverage

### Calculations (`calculations.test.ts`)

Tests for `calculateMetrics()` function covering:

- **Asset Calculations**
  - Total assets from multiple account types
  - Account type segregation (bank, cash, business, investments, insurance)
  - Excluded accounts (deleted, Lent/other type)
  - Overdraft handling
  - Zero balance accounts

- **Credit Card Calculations**
  - Total credit limit across all cards
  - Available credit (limit - outstanding - unbilled)
  - Outstanding amounts
  - Deleted card exclusion

- **Loan Calculations**
  - Total principal across all loans
  - Total outstanding amount
  - Monthly EMI aggregation
  - Loan progress tracking
  - Deleted loan exclusion

- **Liability Calculations**
  - Total liabilities (CC outstanding + loan outstanding)
  - Breakdown by source (cards vs loans)

- **Net Worth Calculations**
  - Assets minus liabilities
  - Positive and negative scenarios
  - Lent exclusion (tracking only)
  - Multi-source calculations

- **Transaction Calculations**
  - Daily income and expense
  - Daily net flow
  - Monthly aggregation
  - Deleted transaction exclusion
  - Correct date filtering

- **Edge Cases**
  - Empty data sets
  - All deleted items
  - Very large numbers
  - Decimal value precision
  - Boundary conditions

### Loan Calculations (`loanCalculations.test.ts`)

Tests for EMI (Equated Monthly Installment) and amortization:

- **EMI Calculation**
  - Standard loans (home, car, personal)
  - Various interest rates and durations
  - Zero interest scenarios
  - Edge cases (1-month, very long duration)

- **Remaining Months**
  - Correct month count calculation
  - Loan completion detection
  - Partial payment scenarios

- **Interest Paid**
  - Total interest over loan lifetime
  - Interest vs. principal breakdown
  - Impact of duration on total interest
  - Zero-interest loans

- **Principal Paid**
  - Principal amortization over time
  - Increasing principal with each payment
  - Loan progress tracking
  - Full repayment verification

- **Comparison Scenarios**
  - EMI vs. duration trade-offs
  - Interest rate impact
  - Loan comparison analysis
  - Payment progress demonstrations

- **Reliability**
  - Consistent number precision
  - Finite number validation
  - No NaN or Infinity results
  - Reasonable output ranges

## Writing New Tests

### Test Template

```typescript
import { describe, it, expect } from "vitest";

describe("Module Name", () => {
  it("should do something specific", () => {
    // Arrange
    const input = setupTestData();

    // Act
    const result = functionUnderTest(input);

    // Assert
    expect(result).toBe(expectedValue);
  });
});
```

### Best Practices

1. **Clear Test Names**
   - Use "should" prefix: `should calculate total assets correctly`
   - Be specific about conditions
   - Avoid generic names like "should work"

2. **Arrange-Act-Assert Pattern**
   ```typescript
   // Arrange: Set up test data
   const store = createStore({ accounts: [...] });

   // Act: Call the function
   const metrics = calculateMetrics(store);

   // Assert: Verify the result
   expect(metrics.totalAssets).toBe(6500);
   ```

3. **One Assertion per Test (Usually)**
   - Makes failures clear
   - Easier to debug
   - Allows partial test runs

4. **Use Descriptive Variables**
   ```typescript
   const homeOwnerWithDebt = createStore({...});
   const metrics = calculateMetrics(homeOwnerWithDebt);
   ```

5. **Test Edge Cases**
   - Zero values
   - Negative values
   - Very large numbers
   - Empty collections
   - Deleted/soft-deleted items

6. **Use Helper Functions**
   - `createStore()` - Test data creation
   - `createAccount()` - Standard test objects
   - Reduces repetition

7. **Group Related Tests**
   ```typescript
   describe("Net Worth", () => {
     describe("with positive assets", () => {
       it("should calculate correctly", () => {...});
     });
     describe("with negative balance", () => {
       it("should handle debt", () => {...});
     });
   });
   ```

## CI/CD Integration

Tests should run as part of your CI/CD pipeline:

```bash
# In your CI configuration
npm run typecheck
npm run test
npm run build
```

Recommended for:
- Pre-commit hooks (validate before commit)
- Pull requests (require passing tests)
- Before deployment (ensure quality)

## Test Maintenance

### Keep Tests Up-to-Date
- Update tests when calculation logic changes
- Add tests for new features
- Remove tests for deprecated features

### Add Tests for Bugs
When a bug is found:
1. Write a test that reproduces the bug
2. Verify the test fails
3. Fix the code
4. Verify the test passes
5. Keep the test to prevent regression

### Regular Review
- Check coverage reports
- Identify untested paths
- Prioritize critical calculations

## Known Limitations

Current test suite focuses on **business logic**:
- ✅ Financial calculations (primary focus)
- ✅ Data transformations
- ✅ Business rules and constraints
- ❌ UI component rendering (not included)
- ❌ Integration tests (future)
- ❌ API mocking (not applicable yet)

## Future Test Additions

Planned test coverage expansion:
- [ ] Backup/restore logic
- [ ] Google Drive sync scenarios
- [ ] Transaction filtering and search
- [ ] Data import/export validation
- [ ] localStorage persistence
- [ ] Notification system edge cases
- [ ] Form validation rules
- [ ] Category management
- [ ] Recurring transaction logic

## Troubleshooting

### Tests not running
```bash
# Ensure dependencies are installed
npm install

# Clear vitest cache
npm run test -- --clearCache
```

### Import errors
- Check path aliases in `vitest.config.ts`
- Ensure `tsconfig.json` includes test files
- Verify file extensions (.ts vs .tsx)

### Precision errors in number comparisons
```typescript
// Use toBeCloseTo for floating point
expect(result).toBeCloseTo(expected, 2); // 2 decimal places

// Use toBeGreaterThan/toBeLessThan for ranges
expect(result).toBeGreaterThan(0);
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://vitest.dev/guide/why-test)
- [Assertion API](https://vitest.dev/api/expect)

## Questions or Issues?

- Check existing tests for patterns
- Review test output for failure reasons
- Consult the CALCULATIONS guide for formula details
