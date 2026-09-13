import { useMemo } from "preact/hooks";


type IconProps = {
  size?: number;
  className?: string;
}

export default function ArrowIcon({ size = 0.8, className = "" }: IconProps) {
  const sizeValue = useMemo(() => {
    if (size < 0) {
      return `0.8em`;
    }

    return `${size}em`;
  }, [size]);

  return (
    <svg class={className} stroke="currentColor" fill="currentColor" width={sizeValue} height={sizeValue} viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5455">
      <path
        d="M1006.4 252.4c-14-14-36.6-14-50.4 0L512.4 696.8 68.2 252.4c-14-14-36.6-14-50.4 0s-14 36.6 0 50.4l468.6 468.6c7 7 15.6 10.4 25.2 10.4 8.8 0 18.2-3.6 25.2-10.4l468.6-468.6c15-13.8 15-36.4 1-50.4z m0 0"
        p-id="5456"
        data-spm-anchor-id="a313x.search_index.0.i0.6c1e3a81IXZd7a"
        class="selected">
      </path>
    </svg>
  )
}