import Carousel from "@/components/Carousel";
import PropertyCard from "@/components/PropertyCard";
import HeroSearch from "@/features/landing/HeroSearch";
import {
  Blogs,
  Faqs,
  Stats,
  StudentDiscountBanner,
  Testimonials,
  TopUniversities,
  TrendingCities,
  WhyChooseUs,
} from "@/features/landing/Sections";
import {
  useFeatured,
  useRecentlyViewed,
  useRecommended,
  useSpecialOffers,
} from "@/api/hooks";

export default function LandingPage() {
  const featured = useFeatured();
  const recommended = useRecommended();
  const offers = useSpecialOffers();
  const recent = useRecentlyViewed();

  return (
    <div>
      <HeroSearch />
      <TrendingCities />

      <Carousel title="Featured properties" subtitle="Hand-picked verified homes">
        {(featured.data ?? []).map((p) => (
          <PropertyCard key={p.id} property={p} />
        ))}
      </Carousel>

      <TopUniversities />
      <StudentDiscountBanner />

      <Carousel title="Special offers" subtitle="Limited-time student deals">
        {(offers.data ?? []).map((p) => (
          <PropertyCard key={p.id} property={p} />
        ))}
      </Carousel>

      <Stats />

      <Carousel title="Recommended for you" subtitle="Top-rated homes near popular campuses">
        {(recommended.data ?? []).map((p) => (
          <PropertyCard key={p.id} property={p} />
        ))}
      </Carousel>

      {(recent.data?.length ?? 0) > 0 && (
        <Carousel title="Recently viewed">
          {(recent.data ?? []).map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </Carousel>
      )}

      <WhyChooseUs />
      <Testimonials />
      <Blogs />
      <Faqs />
    </div>
  );
}
