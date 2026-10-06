import Image, { type ImageProps } from "next/image";

type CircleQuestionIconProps = Omit<
  ImageProps,
  "src" | "alt" | "width" | "height"
> & {
  width?: number;
  height?: number;
};

export function CircleQuestionIcon({
  width = 16,
  height = 16,
  ...props
}: CircleQuestionIconProps) {
  return (
    <Image
      src="/icons/circle-question-solid-full.svg"
      alt=""
      width={width}
      height={height}
      aria-hidden="true"
      {...props}
    />
  );
}