const { argv, exit } = require("process")
const { readFileSync, writeFileSync } = require("fs")
const { join } = require("path")

if (argv.length < 3) {
    console.log("Usage: node desugar.js <ruleID>")
    exit()
}

const ruleId = argv[2]
const rulePath = join(__dirname, "..", "..", ruleId)

const rule = JSON.parse(readFileSync(join(rulePath, "rule-sugared.json"), "utf8"))

const not = (expr) => ({ "!": [ expr ] })

const desugar = (expr) => {
    if (Array.isArray(expr)) {
        return expr.map(desugar)
    }
    if (typeof expr === "object" && Object.entries(expr).length === 1) {
        const [ operator, operands ] = Object.entries(expr)[0]
        switch (operator) {
            case "or": return not({
                "and": operands.map((operand) => not(desugar(operand)))
            })
            case "var": return expr
            default: return { [operator]: operands.map(desugar) }
        }
    }
    return expr
}

rule.Logic = desugar(rule.Logic)

writeFileSync(join(rulePath, "rule.json"), JSON.stringify(rule, null, 2), "utf8")

