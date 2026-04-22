#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <ctype.h>

static double toRadians(double degrees) {
    return degrees * M_PI / 180.0;
}

static double degreesFromRadians(double radians) {
    return radians * 180.0 / M_PI;
}

static double parseDouble(const char *str) {
    char *endptr;
    return strtod(str, &endptr);
}

void printUsage(const char *prog) {
    printf("Usage: %s <operation> [arguments]\n", prog);
    printf("\nOperations:\n");
    printf("  Arithmetic:\n");
    printf("    + <a> <b>      Add two numbers\n");
    printf("    - <a> <b>      Subtract two numbers\n");
    printf("    * <a> <b>      Multiply two numbers\n");
    printf("    / <a> <b>      Divide two numbers\n");
    printf("    mod <a> <b>    Modulo of a by b\n");
    printf("\nPower:\n");
    printf("    ^ <a> <b>      a to the power of b\n");
    printf("\nTrigonometry (degrees):\n");
    printf("    sin <a>        Sine of a\n");
    printf("    cos <a>        Cosine of a\n");
    printf("    tan <a>        Tangent of a\n");
    printf("    asin <a>       Arcsine of a\n");
    printf("    acos <a>       Arc-cosine of a\n");
    printf("    atan <a>       Arc-tangent of a\n");
    printf("    atan2 <a> <b>  Arc-tangent of y/x\n");
    printf("    inv <a> <b>    Inverse hyperbolic functions\n");
    printf("\nLogarithms:\n");
    printf("    log <a>        Natural log\n");
    printf("    log10 <a>      Base-10 log\n");
    printf("    ln <a>         Alias for natural log\n");
    printf("    log2 <a>       Base-2 log\n");
    printf("\nExponentials:\n");
    printf("    exp <a>        e^a\n");
    printf("    sinh <a>       Hyperbolic sine\n");
    printf("    cosh <a>       Hyperbolic cosine\n");
    printf("    tanh <a>       Hyperbolic tangent\n");
    printf("    asinh <a>      Inverse hyperbolic sine\n");
    printf("    acosh <a>      Inverse hyperbolic cosine\n");
    printf("    atanh <a>      Inverse hyperbolic tangent\n");
    printf("\nRoots and Special:\n");
    printf("    sqrt <a>       Square root\n");
    printf("    cbrt <a>      Cube root\n");
    printf("    pow <a> <b>    Alias for ^\n");
    printf("    abs <a>        Absolute value\n");
    printf("    floor <a>      Floor\n");
    printf("    ceil <a>       Ceiling\n");
    printf("    trunc <a>      Truncate\n");
    printf("    round <a>      Round to nearest int\n");
    printf("    sign <a>       Sign function\n");
    printf("\nMinimum/Maximum:\n");
    printf("    min <a> <b>    Minimum\n");
    printf("    max <a> <b>    Maximum\n");
    printf("    mmin <a> <b>  Max with saturation\n");
    printf("    mmax <a> <b>  Min with saturation\n");
    printf("\nConstants:\n");
    printf("    pi             Pi\n");
    printf("    e              Euler's number\n");
}

int main(int argc, char *argv[]) {
    if (argc < 2) {
        printUsage(argv[0]);
        return 0;
    }
    
    const char *op = argv[1];
    const char *a_str = (argc > 2) ? argv[2] : "0";
    const char *b_str = (argc > 3) ? argv[3] : "0";
    
    double a = parseDouble(a_str);
    double b = parseDouble(b_str);
    
    if (strcmp(op, "+") == 0) {
        printf("%g\n", a + b);
    } else if (strcmp(op, "-") == 0) {
        printf("%g\n", a - b);
    } else if (strcmp(op, "*") == 0) {
        printf("%g\n", a * b);
    } else if (strcmp(op, "/") == 0) {
        if (b == 0) {
            fprintf(stderr, "Error: Division by zero\n");
            return EXIT_FAILURE;
        }
        printf("%g\n", a / b);
    } else if (strcmp(op, "mod") == 0) {
        double result = fmod(a, b);
        if ((a < 0 && result < 0) || (a > 0 && result > 0)) {
            result = (result < 0) ? result + b : result;
        }
        printf("%g\n", result);
    } else if (strcmp(op, "^") == 0 || strcmp(op, "pow") == 0) {
        printf("%g\n", pow(a, b));
    } else if (strcmp(op, "sqrt") == 0) {
        if (a < 0) {
            fprintf(stderr, "Error: sqrt of negative number\n");
            return EXIT_FAILURE;
        }
        printf("%g\n", sqrt(a));
    } else if (strcmp(op, "cbrt") == 0) {
        printf("%g\n", cbrt(a));
    } else if (strcmp(op, "sin") == 0) {
        printf("%g\n", sin(toRadians(a)));
    } else if (strcmp(op, "cos") == 0) {
        printf("%g\n", cos(toRadians(a)));
    } else if (strcmp(op, "tan") == 0) {
        printf("%g\n", tan(toRadians(a)));
    } else if (strcmp(op, "asin") == 0) {
        double rad = asin(a);
        printf("%g\n", degreesFromRadians(rad));
    } else if (strcmp(op, "acos") == 0) {
        double rad = acos(a);
        printf("%g\n", degreesFromRadians(rad));
    } else if (strcmp(op, "atan") == 0) {
        double rad = atan(a);
        printf("%g\n", degreesFromRadians(rad));
    } else if (strcmp(op, "atan2") == 0) {
        double rad = atan2(b, a);
        printf("%g\n", degreesFromRadians(rad));
    } else if (strcmp(op, "log") == 0 || strcmp(op, "ln") == 0) {
        if (a <= 0) {
            fprintf(stderr, "Error: log of non-positive number\n");
            return EXIT_FAILURE;
        }
        printf("%g\n", log(a));
    } else if (strcmp(op, "log2") == 0) {
        if (a <= 0) {
            fprintf(stderr, "Error: log2 of non-positive number\n");
            return EXIT_FAILURE;
        }
        printf("%g\n", log(a) / log(2.0));
    } else if (strcmp(op, "log10") == 0) {
        if (a <= 0) {
            fprintf(stderr, "Error: log10 of non-positive number\n");
            return EXIT_FAILURE;
        }
        printf("%g\n", log(a) / log(10.0));
    } else if (strcmp(op, "exp") == 0) {
        printf("%g\n", exp(a));
    } else if (strcmp(op, "sinh") == 0) {
        printf("%g\n", sinh(a));
    } else if (strcmp(op, "cosh") == 0) {
        printf("%g\n", cosh(a));
    } else if (strcmp(op, "tanh") == 0) {
        printf("%g\n", tanh(a));
    } else if (strcmp(op, "asinh") == 0) {
        printf("%g\n", asinh(a));
    } else if (strcmp(op, "acosh") == 0) {
        if (a < 1.0) {
            fprintf(stderr, "Error: acosh of number less than 1\n");
            return EXIT_FAILURE;
        }
        printf("%g\n", acosh(a));
    } else if (strcmp(op, "atanh") == 0) {
        if (a <= -1.0 || a >= 1.0) {
            fprintf(stderr, "Error: atanh of value outside (-1, 1)\n");
            return EXIT_FAILURE;
        }
        printf("%g\n", atanh(a));
    } else if (strcmp(op, "abs") == 0) {
        printf("%g\n",fabs(a));
    } else if (strcmp(op, "floor") == 0) {
        printf("%g\n", floor(a));
    } else if (strcmp(op, "ceil") == 0) {
        printf("%g\n", ceil(a));
    } else if (strcmp(op, "trunc") == 0) {
        printf("%g\n", trunc(a));
    } else if (strcmp(op, "round") == 0) {
        printf("%g\n", round(a));
    } else if (strcmp(op, "sign") == 0) {
        if (a > 0) printf("1.0\n");
        else if (a < 0) printf("-1.0\n");
        else printf("0.0\n");
    } else if (strcmp(op, "min") == 0) {
        printf("%g\n", fmin(a, b));
    } else if (strcmp(op, "max") == 0) {
        printf("%g\n", fmax(a, b));
    } else if (strcmp(op, "mmin") == 0) {
        printf("%g\n", a < b ? a : b);
    } else if (strcmp(op, "mmax") == 0) {
        printf("%g\n", a > b ? a : b);
    } else if (strcmp(op, "pi") == 0) {
        printf("%.15g\n", M_PI);
    } else if (strcmp(op, "e") == 0) {
        printf("%.15g\n", exp(1.0));
    } else if (strcmp(op, "-h") == 0 || strcmp(op, "--help") == 0) {
        printUsage(argv[0]);
    } else if (strcmp(op, "-v") == 0 || strcmp(op, "--version") == 0) {
        printf("Calculator v1.0\n");
    } else if (argc == 2) {
        printf("%g\n", a);
    } else {
        fprintf(stderr, "Error: Unknown operation '%s'\n", op);
        printUsage(argv[0]);
        return EXIT_FAILURE;
    }
    
    return EXIT_SUCCESS;
}
