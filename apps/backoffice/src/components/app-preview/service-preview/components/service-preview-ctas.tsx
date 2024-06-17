import { Stack, styled } from "@mui/material";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/function";
import FM from "front-matter";
import { CTAS, ServiceMessageCTA } from "../../../../types/ctas";
import { MobileButton } from "../../components";

type ServicePreviewCTAsProps = {
  cta?: string;
};

const ServicePreviewCTAs = ({ cta }: ServicePreviewCTAsProps) => {
  const maybeCTAs = extractCTAs(cta);

  if (O.isNone(maybeCTAs)) {
    return <></>;
  }

  return (
    <Stack
      paddingX={3}
      paddingY={2}
      direction="column"
    >
      <MobileButton text={maybeCTAs.value.cta_1.text} isPrimary />
      {maybeCTAs.value.cta_2 && (
        <MobileButton text={maybeCTAs.value.cta_2.text} />
      )}
    </Stack>
  );
};

const extractCTAs = (cta?: string): O.Option<CTAS> =>
  pipe(
    cta,
    O.fromNullable,
    O.chain(cta =>
      pipe(
        cta,
        O.of,
        //FM.test,
        //O.fromPredicate(identity),
        O.chain(() =>
          pipe(
            E.tryCatch(() => FM<ServiceMessageCTA>(cta).attributes, E.toError),
            E.mapLeft(() => console.error("Front matter CTAs decoding error")),
            O.fromEither
          )
        ),
        O.chain(attributes =>
          pipe(
            attributes["it"], // TODO: think about use current user locale
            CTAS.decode,
            O.fromEither
            // TODO: check if the decoded actions are valid
          )
        )
      )
    )
  );

export default ServicePreviewCTAs;
