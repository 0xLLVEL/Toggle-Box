import DetailPage from './[id]/page';

export default function DefaultDetailPage() {
  return <DetailPage params={Promise.resolve({ id: 'the-love-hypothesis' })} />;
}
