import { Exp, Program, PrimOp, isProgram, isDefineExp, isNumExp, isBoolExp, isStrExp, isPrimOp, isVarRef, isAppExp, isIfExp, isProcExp } from './L3/L3-ast';
import { Result, makeFailure, makeOk, bind, mapResult } from './shared/result';

/*
Purpose: Transform L2 AST to Python program string
Signature: l2ToPython(l2AST)
Type: [Parsed | Error] => Result<string>
*/
export const l2ToPython = (exp: Exp | Program): Result<string> => 
    isProgram(exp) ? bind(mapResult(l2ToPython, exp.exps), (exps: string[]) => makeOk(exps.join("\n"))) :
    isDefineExp(exp) ? bind(l2ToPython(exp.val), (val: string) => makeOk(`${exp.var.var} = ${val}`)) :
    isNumExp(exp) ? makeOk(exp.val.toString()) :
    isBoolExp(exp) ? makeOk(exp.val ? "True" : "False") :
    isStrExp(exp) ? makeOk(`"${exp.val}"`) :
    isVarRef(exp) ? makeOk(exp.var) :
    isPrimOp(exp) ? makeOk(convertPrimOp(exp.op)) :
    isIfExp(exp) ? bind(l2ToPython(exp.test), (test: string) =>
                    bind(l2ToPython(exp.then), (then: string) =>
                     bind(l2ToPython(exp.alt), (alt: string) =>
                      makeOk(`(${then} if ${test} else ${alt})`)))) :
    isProcExp(exp) ? bind(l2ToPython(exp.body[0]), (body: string) => 
                      makeOk(`(lambda ${exp.args.map(a => a.var).join(', ')}: ${body})`.replace("lambda :", "lambda:"))) :
    isAppExp(exp) ? (
        isPrimOp(exp.rator) ? 
            bind(mapResult(l2ToPython, exp.rands), (rands: string[]) => makeOk(convertAppPrimOp((exp.rator as PrimOp).op, rands))) :
            bind(l2ToPython(exp.rator), (rator: string) => 
             bind(mapResult(l2ToPython, exp.rands), (rands: string[]) => 
              makeOk(`${rator}(${rands.join(', ')})`)))
    ) :
    makeFailure(`Unknown expression: ${exp}`);

// Helper to translate primitive operator symbols
const convertPrimOp = (op: string): string => {
    switch (op) {
        case "=":
        case "eq?": return "==";
        case "and": return "and";
        case "or": return "or";
        case "not": return "not";
        case "boolean?": return "(lambda x : (type(x) == bool))";
        case "number?": return "(lambda x : (type(x) == int or type(x) == float))";
        case "symbol?":
        case "string?": return "(lambda x : (type(x) == str))";
        default: return op; // Fallback for +, -, *, /, <, >
    }
}

// Helper to format an application of a primitive operator
const convertAppPrimOp = (op: string, rands: string[]): string => {
    if (op === "not") {
        return `(not ${rands[0]})`;
    } else if (op === "boolean?" || op === "number?" || op === "symbol?" || op === "string?") {
        return `${convertPrimOp(op)}(${rands[0]})`;
    } else if (op === "-" && rands.length === 1) { // Handling unary minus e.g. (- 5)
        return `(-${rands[0]})`;
    } else {
        // Typical binary operators (+, -, *, /, <, >, ==, and, or)
        return `(${rands.join(` ${convertPrimOp(op)} `)})`;
    }
}