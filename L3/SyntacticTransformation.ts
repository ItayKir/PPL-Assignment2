import { ClassExp, ProcExp, Exp, Program, Binding, CExp,
    makeProcExp, makeVarDecl, makeVarRef, makeIfExp, 
    makeAppExp, makePrimOp, makeLitExp, makeLetExp, makeProgram, makeDefineExp,makeBinding,
    isAtomicExp,
    isLitExp,
    isProgram,
    isLetExp,
    isDefineExp,
    isProcExp,
    isCExp,
    isAppExp,
    isClassExp,
    isIfExp} from "./L3-ast";
import { Result, makeFailure, makeOk, bind, mapResult } from "../shared/result";

import { reduceRight } from "ramda";
import { makeSymbolSExp } from "./L3-value";

/*
Purpose: Transform ClassExp to ProcExp
Signature: class2proc(classExp)
Type: ClassExp => ProcExp
*/
export const class2proc = (exp: ClassExp): ProcExp =>{
    const baseError = makeLitExp(makeSymbolSExp("error"));

    const methods = exp.methods.reduceRight((acc: CExp, method: Binding) => {
        
        const testCondition = makeAppExp(
            makePrimOp("eq?"),
            [makeVarRef("msg"), makeLitExp(makeSymbolSExp(method.var.var))]
        );

        const thenBody = (method.val as ProcExp).body[0];

        return makeIfExp(testCondition, thenBody, acc);
        
    }, baseError);

    const innerFunction = makeProcExp([makeVarDecl("msg")], [methods]);

    return makeProcExp(exp.fields, [innerFunction]);
}


/*
Purpose: Transform all class forms in the given AST to procs
Signature: transform(AST)
Type: [Exp | Program] => Result<Exp | Program>
*/

const transformCExp = (exp: CExp): Result<CExp> => {
    // Leaves / Base Cases (Nothing to transform)
    if (isAtomicExp(exp) || isLitExp(exp)) {
        return makeOk(exp);
    } 
    
    // Target Case: ClassExp
    else if (isClassExp(exp)) {
        // TOP-DOWN APPROACH:
        // We first convert the ClassExp into a ProcExp using your class2proc function.
        // Then, we recursively call transformCExp on the RESULT. 
        // This guarantees that if a class method contains another nested class, 
        // it will also be found and transformed!
        return transformCExp(class2proc(exp));
    } 
    
    // Recursive Case: IfExp
    else if (isIfExp(exp)) {
        return bind(transformCExp(exp.test), (test: CExp) =>
            bind(transformCExp(exp.then), (then: CExp) =>
                bind(transformCExp(exp.alt), (alt: CExp) =>
                    makeOk(makeIfExp(test, then, alt))
                )
            )
        );
    } 
    
    // Recursive Case: AppExp
    else if (isAppExp(exp)) {
        return bind(transformCExp(exp.rator), (rator: CExp) =>
            bind(mapResult(transformCExp, exp.rands), (rands: CExp[]) =>
                makeOk(makeAppExp(rator, rands))
            )
        );
    } 
    
    // Recursive Case: ProcExp
    else if (isProcExp(exp)) {
        return bind(mapResult(transformCExp, exp.body), (body: CExp[]) =>
            makeOk(makeProcExp(exp.args, body))
        );
    } 
    
    // Recursive Case: LetExp
    else if (isLetExp(exp)) {
        // For LetExp, we must map over the bindings and transform their values
        const transformBinding = (b: Binding): Result<Binding> =>
            bind(transformCExp(b.val), (transformedVal: CExp) => 
                makeOk(makeBinding(b.var.var, transformedVal))
            );

        return bind(mapResult(transformBinding, exp.bindings), (bindings: Binding[]) =>
            bind(mapResult(transformCExp, exp.body), (body: CExp[]) =>
                makeOk(makeLetExp(bindings, body))
            )
        );
    } 
    
    // Fallback
    else {
        return makeFailure(`Unexpected CExp: ${exp}`);
    }
};

// ========================================================
// 2. General Expression Transformer (Handles Defines)
// ========================================================
const transformExp = (exp: Exp): Result<Exp> => {
    if (isDefineExp(exp)) {
        // Transform the value inside the define, keep the variable the same
        return bind(transformCExp(exp.val), (val: CExp) =>
            makeOk(makeDefineExp(exp.var, val))
        );
    } else if (isCExp(exp)) {
        return transformCExp(exp);
    } else {
        return makeFailure(`Unexpected Exp: ${exp}`);
    }
};

// ========================================================
// 3. Main Entry Point
// ========================================================
export const transform = (exp: Exp | Program): Result<Exp | Program> => {
    if (isProgram(exp)) {
        // Map over all expressions in the program
        return bind(mapResult(transformExp, exp.exps), (exps: Exp[]) =>
            makeOk(makeProgram(exps))
        );
    } else if (isDefineExp(exp) || isCExp(exp)) { // Type narrowing for Exp
        return transformExp(exp);
    } else {
        return makeFailure("Unexpected AST node");
    }
};