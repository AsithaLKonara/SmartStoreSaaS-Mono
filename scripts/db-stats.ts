import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
    console.log("📊 Database Table Statistics\n")
    const models = Object.keys(prisma).filter(key =>
        !key.startsWith("$") && !key.startsWith("_") && typeof (prisma as any)[key].count === "function"
    )

    const stats = []
    for (const model of models) {
        try {
            const count = await (prisma as any)[model].count()
            stats.push({ Table: model, Rows: count })
        } catch (e) {
            // stats.push({ Table: model, Rows: "Error" })
        }
    }

    stats.sort((a, b) => (b.Rows as number) - (a.Rows as number))
    console.table(stats)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
