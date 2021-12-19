import archiver from "archiver";
import IHears from "../../interface/module/hears/hears.interface";
import IContext from "../../interface/context/context.interface";
import RequestEntity from "../../entity/request.entity";

export default class DownloadAllDocumentsHears implements IHears {
  triggers = "🗄 Скачать документы всех заявок";

  async exec(ctx: IContext) {
    const requestRepo = ctx.bot.db.getRepository(RequestEntity);
    const requests = await requestRepo.find({ relations: ["documents"] });
    if (requests.length === 0) {
      return ctx.reply("Заявки еще не приходили!");
    }
    const archive = archiver("zip", { zlib: { level: 9 } });

    let docCount = 0;
    let reqCount = 0;

    for (const req of requests) {
      reqCount++;

      const { documents } = req;

      await Promise.all(
        documents.map(async (doc, i) => {
          docCount++;

          const isPhoto = doc.minioId.split(":").at(-1) === "photo";
          const filename = isPhoto ? `Документ ${i + 1}.png` : doc.fileName;

          const file = await ctx.bot.minio.getObject(
            ctx.bot.minioBucket,
            doc.minioId
          );

          archive.append(file, { name: `Запрос #${req.id}/${filename}` });

          // return ctx.replyWithDocument(
          //   { source: file, filename },
          //   {
          //     caption: `Документ #${i + 1}/${documents.length} от заявки #${
          //       req.id
          //     }`,
          //   }
          // );
        })
      );
    }

    await archive.finalize();
    return ctx.replyWithDocument(
      { source: archive, filename: "requests.zip" },
      {
        caption: `Архив со всеми ${docCount} документами от ${reqCount} заявок`,
      }
    );
  }
}
